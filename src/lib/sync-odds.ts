import { createClient } from '@supabase/supabase-js'

const SPORT_DETAILS: Record<string, { sport_id: string, sport_name: string, league_id: string, league_name: string }> = {
  'basketball_nba': { sport_id: 'nba', sport_name: 'Basketball', league_id: 'nba_regular', league_name: 'NBA' },
  'americanfootball_nfl': { sport_id: 'nfl', sport_name: 'Football', league_id: 'nfl_regular', league_name: 'NFL' },
  'soccer_uefa_champs_league': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'ucl', league_name: 'Champions League' },
  'soccer_epl': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'epl', league_name: 'Premier League' },
  'soccer_germany_bundesliga': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'bundesliga', league_name: 'Bundesliga' },
  'soccer_spain_la_liga': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'laliga', league_name: 'La Liga' },
  'soccer_italy_serie_a': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'seriea', league_name: 'Serie A' },
  'soccer_france_ligue_one': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'ligue1', league_name: 'Ligue 1' },
  'soccer_portugal_primeira_liga': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'primeira', league_name: 'Primeira Liga' },
  'baseball_mlb': { sport_id: 'baseball', sport_name: 'Baseball', league_id: 'mlb_regular', league_name: 'MLB' },
  'icehockey_nhl': { sport_id: 'hockey', sport_name: 'Hockey', league_id: 'nhl_regular', league_name: 'NHL' },
  'tennis_atp_wimbledon': { sport_id: 'tennis', sport_name: 'Tennis', league_id: 'wimbledon', league_name: 'Wimbledon' }
}

interface SyncResult {
  sport: string
  count?: number
  error?: string
}

export async function syncLiveOdds(): Promise<SyncResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const oddsApiKey = process.env.THE_ODDS_API_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials (URL/Service Key) are missing')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (!oddsApiKey) {
    throw new Error('THE_ODDS_API_KEY is not defined')
  }

  const sports = Object.keys(SPORT_DETAILS)
  const results: SyncResult[] = []

  // Lists for bulk operations
  const allEventsToUpsert: any[] = []
  const allMarketsToUpsert: any[] = []
  const sportEntries = new Map<string, any>()
  const leagueEntries = new Map<string, any>()

  // 1. Fetch data sequentially to avoid 429 Rate Limits from The Odds API
  for (const sportKey of sports) {
    try {
      const detail = SPORT_DETAILS[sportKey]
      sportEntries.set(detail.sport_id, { id: detail.sport_id, name: detail.sport_name })
      leagueEntries.set(detail.league_id, { id: detail.league_id, sport_id: detail.sport_id, name: detail.league_name })

      let response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${oddsApiKey}&regions=us,eu,uk&markets=h2h,spreads&oddsFormat=decimal`
      )

      // Simple retry logic for 429
      if (response.status === 429) {
        console.log(`Rate limited on ${sportKey}, waiting 2s before retry...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${oddsApiKey}&regions=us,eu,uk&markets=h2h,spreads&oddsFormat=decimal`
        )
      }

      if (!response.ok) {
        results.push({ sport: sportKey, error: `API Error: ${response.status} ${response.statusText}` })
        continue
      }

      const eventsData = await response.json()
      results.push({ sport: sportKey, count: eventsData.length })

      for (const event of eventsData) {
        allEventsToUpsert.push({
          external_id: event.id,
          league_id: detail.league_id,
          home_team: event.home_team,
          away_team: event.away_team,
          start_time: event.commence_time,
          status: 'scheduled'
        })

        const bookmaker = event.bookmakers?.[0]
        if (!bookmaker) continue

        for (const market of bookmaker.markets) {
          const marketType = market.key === 'h2h' ? 'moneyline' : market.key
          for (const outcome of market.outcomes) {
            const selectionName = outcome.point ? `${outcome.name} (${outcome.point > 0 ? '+' : ''}${outcome.point})` : outcome.name
            allMarketsToUpsert.push({
              event_id_external: event.id, 
              payload: {
                external_id: `${event.id}_${market.key}_${outcome.name}`,
                market_type: marketType,
                selection: selectionName,
                odds: outcome.price
              }
            })
          }
        }
      }
      
      // Increased buffer to avoid rate limit spikes
      await new Promise(resolve => setTimeout(resolve, 800))
    } catch (err) {
      results.push({ sport: sportKey, error: err instanceof Error ? err.message : 'Unknown' })
    }
  }

  // 2. Perform bulk DB operations (very fast)
  if (sportEntries.size > 0) {
    await supabase.from('sports').upsert(Array.from(sportEntries.values()), { onConflict: 'id' })
  }
  if (leagueEntries.size > 0) {
    await supabase.from('leagues').upsert(Array.from(leagueEntries.values()), { onConflict: 'id' })
  }

  if (allEventsToUpsert.length > 0) {
    const { data: eventRows, error: eventError } = await supabase
      .from('events')
      .upsert(allEventsToUpsert, { onConflict: 'external_id' })
      .select('id, external_id')

    if (eventError) {
      console.error('Bulk Event Upsert Error:', eventError)
      return results
    }

    const eventIdMap = new Map((eventRows || []).map(r => [r.external_id, r.id]))

    const finalMarkets = allMarketsToUpsert
      .map(m => ({
        ...m.payload,
        event_id: eventIdMap.get(m.event_id_external)
      }))
      .filter(m => m.event_id)

    const CHUNK_SIZE = 500
    for (let i = 0; i < finalMarkets.length; i += CHUNK_SIZE) {
      const chunk = finalMarkets.slice(i, i + CHUNK_SIZE)
      const { error: marketError } = await supabase
        .from('event_markets')
        .upsert(chunk, { onConflict: 'external_id' })
      
      if (marketError) console.error('Bulk Market Error:', marketError)
    }
  }

  return results
}
