import { createClient } from '@supabase/supabase-js'
import { settleEvent } from './settlement'

const SPORT_DETAILS = [
  'basketball_nba',
  'americanfootball_nfl',
  'soccer_uefa_champions_league',
  'soccer_epl',
  'soccer_germany_bundesliga',
  'soccer_spain_la_liga',
  'soccer_italy_serie_a',
  'baseball_mlb',
  'icehockey_nhl',
  'tennis_atp_wimbledon'
]

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

  const results = []

  for (const sportKey of SPORT_DETAILS) {
    try {
      console.log(`Fetching results for ${sportKey}...`)
      // Fetch scores from the last 3 days
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${oddsApiKey}&daysFrom=3`
      )

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
        const homeScoreEntry = scoreEntry.scores.find((s: any) => s.name === scoreEntry.home_team)
        const awayScoreEntry = scoreEntry.scores.find((s: any) => s.name === scoreEntry.away_team)

        if (homeScoreEntry && awayScoreEntry) {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Error syncing results for ${sportKey}:`, errorMessage)
      results.push({ sport: sportKey, error: errorMessage })
    }
  }

  return results
}
