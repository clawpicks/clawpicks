import { createClient } from '@supabase/supabase-js'
import { settleEvent } from './settlement'

const SPORT_DETAILS: Record<string, string> = {
  'nba_regular': 'basketball_nba',
  'nfl_regular': 'americanfootball_nfl',
  'ucl': 'soccer_uefa_champs_league',
  'epl': 'soccer_epl',
  'bundesliga': 'soccer_germany_bundesliga',
  'laliga': 'soccer_spain_la_liga',
  'seriea': 'soccer_italy_serie_a',
  'ligue1': 'soccer_france_ligue_one',
  'primeira': 'soccer_portugal_primeira_liga',
  'mlb_regular': 'baseball_mlb',
  'nhl_regular': 'icehockey_nhl',
  'wimbledon': 'tennis_atp_wimbledon'
}

export async function syncCompletedResults() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const oddsApiKey = process.env.THE_ODDS_API_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials (URL/Service Key) are missing')
  }

  // Private client with service role to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (!oddsApiKey) {
    throw new Error('THE_ODDS_API_KEY is not defined')
  }

  // 1. Gather all active leagues we need to check scores for
  const activeLeagueIds = new Set<string>()

  // Check straight picks
  const { data: picks } = await supabase
    .from('picks')
    .select('events!inner(league_id)')
    .eq('status', 'open')
  
  picks?.forEach(p => {
    if ((p.events as any)?.league_id) activeLeagueIds.add((p.events as any).league_id)
  })

  // Check parlay legs
  const { data: legs } = await supabase
    .from('parlay_legs')
    .select('events!inner(league_id)')
    .eq('status', 'open')

  legs?.forEach(l => {
    if ((l.events as any)?.league_id) activeLeagueIds.add((l.events as any).league_id)
  })

  const sportsToFetch = new Set<string>()
  for (const leagueId of activeLeagueIds) {
    if (SPORT_DETAILS[leagueId]) {
      sportsToFetch.add(SPORT_DETAILS[leagueId])
    }
  }

  const results = []

  if (sportsToFetch.size === 0) {
    console.log('No active picks found. Skipping results sync.')
    return [{ message: 'No active picks to settle' }]
  }

  // 2. Fetch results only for needed sports
  for (const sportKey of sportsToFetch) {
    try {
      console.log(`Fetching results for ${sportKey}...`)
      
      let response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${oddsApiKey}&daysFrom=3`
      )

      // Retry for 429
      if (response.status === 429) {
        console.log(`Rate limited on results for ${sportKey}, waiting 2s...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${oddsApiKey}&daysFrom=3`
        )
      }

      if (!response.ok) {
        console.error(`Failed to fetch scores for ${sportKey}: ${response.status} ${response.statusText}`)
        continue
      }

      const scoresData = await response.json()
      let settledCount = 0

      for (const scoreEntry of scoresData) {
        if (!scoreEntry.completed) continue

        // Check if we have this event in our DB and if it's not yet completed
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, status')
          .eq('external_id', scoreEntry.id)
          .single()

        if (eventError || !event) continue
        if (event.status === 'completed') continue

        // Game is completed in API but not in our DB
        const homeScoreEntry = scoreEntry.scores?.find((s: any) => s.name === scoreEntry.home_team)
        const awayScoreEntry = scoreEntry.scores?.find((s: any) => s.name === scoreEntry.away_team)

        if (homeScoreEntry?.score && awayScoreEntry?.score) {
          console.log(`Settling event ${event.id} (${scoreEntry.home_team} vs ${scoreEntry.away_team}): ${homeScoreEntry.score} - ${awayScoreEntry.score}`)
          await settleEvent(
            supabase,
            event.id,
            parseInt(homeScoreEntry.score),
            parseInt(awayScoreEntry.score)
          )
          settledCount++
        }
      }

      results.push({ sport: sportKey, settledCount })
      
      // Small buffer to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Error syncing results for ${sportKey}:`, errorMessage)
      results.push({ sport: sportKey, error: errorMessage })
    }
  }

  return results
}
