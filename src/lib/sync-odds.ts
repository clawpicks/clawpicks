import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const oddsApiKey = process.env.THE_ODDS_API_KEY!

// Private client with service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SPORT_DETAILS: Record<string, { sport_id: string, sport_name: string, league_id: string, league_name: string }> = {
  'basketball_nba': { sport_id: 'nba', sport_name: 'Basketball', league_id: 'nba_regular', league_name: 'NBA' },
  'americanfootball_nfl': { sport_id: 'nfl', sport_name: 'Football', league_id: 'nfl_regular', league_name: 'NFL' },
  'soccer_uefa_champions_league': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'ucl', league_name: 'Champions League' },
  'soccer_epl': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'epl', league_name: 'Premier League' },
  'soccer_germany_bundesliga': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'bundesliga', league_name: 'Bundesliga' },
  'soccer_spain_la_liga': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'laliga', league_name: 'La Liga' },
  'soccer_italy_serie_a': { sport_id: 'soccer', sport_name: 'Soccer', league_id: 'seriea', league_name: 'Serie A' },
  'baseball_mlb': { sport_id: 'baseball', sport_name: 'Baseball', league_id: 'mlb_regular', league_name: 'MLB' },
  'icehockey_nhl': { sport_id: 'hockey', sport_name: 'Hockey', league_id: 'nhl_regular', league_name: 'NHL' },
  'tennis_atp_wimbledon': { sport_id: 'tennis', sport_name: 'Tennis', league_id: 'wimbledon', league_name: 'Wimbledon' }
}

export async function syncLiveOdds() {
  if (!oddsApiKey) {
    throw new Error('THE_ODDS_API_KEY is not defined')
  }

  const sports = Object.keys(SPORT_DETAILS)
  const results = []

  for (const sportKey of sports) {
    try {
      console.log(`Syncing ${sportKey}...`)
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${oddsApiKey}&regions=eu&markets=h2h&oddsFormat=decimal`
      )

      if (!response.ok) {
        console.error(`Failed to fetch ${sportKey}: ${response.status} ${response.statusText}`)
        continue
      }

      const eventsData = await response.json()
      const detail = SPORT_DETAILS[sportKey]

      // 1. Ensure Sport exists
      await supabase.from('sports').upsert({ id: detail.sport_id, name: detail.sport_name })
      
      // 2. Ensure League exists
      await supabase.from('leagues').upsert({ id: detail.league_id, sport_id: detail.sport_id, name: detail.league_name })
      
      for (const event of eventsData) {
        // 3. Upsert Event
        const { data: eventRow, error: eventError } = await supabase
          .from('events')
          .upsert({
            external_id: event.id,
            league_id: detail.league_id,
            home_team: event.home_team,
            away_team: event.away_team,
            start_time: event.commence_time,
            status: 'scheduled'
          }, { onConflict: 'external_id' })
          .select('id')
          .single()

        if (eventError) {
          console.error(`Error upserting event ${event.id}:`, eventError)
          continue
        }

        // 4. Sync Markets
        const bookmaker = event.bookmakers?.[0]
        if (!bookmaker) continue

        const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h')
        if (!h2hMarket) continue

        for (const outcome of h2hMarket.outcomes) {
          const marketExtId = `${event.id}_h2h_${outcome.name}`
          
          const { error: marketError } = await supabase
            .from('event_markets')
            .upsert({
              external_id: marketExtId,
              event_id: eventRow.id,
              market_type: 'moneyline',
              selection: outcome.name,
              odds: outcome.price
            }, { onConflict: 'external_id' })

          if (marketError) {
            console.error(`Error upserting market ${marketExtId}:`, marketError)
          }
        }
      }
      
      results.push({ sport: sportKey, count: eventsData.length })
    } catch (err: any) {
      console.error(`Error syncing ${sportKey}:`, err.message)
      results.push({ sport: sportKey, error: err.message })
    }
  }

  return results
}
