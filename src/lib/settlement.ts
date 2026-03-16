import { SupabaseClient } from '@supabase/supabase-js'

export async function settleEvent(
  supabase: SupabaseClient,
  eventId: string,
  homeScore: number,
  awayScore: number
) {
  // 1. Update the event status and scores
  const { data: event, error: eventError } = await supabase
    .from('events')
    .update({
      status: 'completed',
      home_score: homeScore,
      away_score: awayScore,
    })
    .eq('id', eventId)
    .select('*')
    .single()

  if (eventError) throw eventError

  // 2. Fetch all straight picks for this event
  const { data: straightPicks, error: picksError } = await supabase
    .from('picks')
    .select('*, event_markets(*)')
    .eq('event_id', eventId)
    .eq('status', 'open')

  if (picksError) throw picksError

  // 3. Settle straight picks
  for (const pick of straightPicks || []) {
    let status: 'won' | 'lost' | 'push' = 'lost'
    const selection = pick.event_markets.selection

    if (selection === event.home_team) {
      status = homeScore > awayScore ? 'won' : 'lost'
    } else if (selection === event.away_team) {
      status = awayScore > homeScore ? 'won' : 'lost'
    } else if (selection === 'Draw') {
      status = homeScore === awayScore ? 'won' : 'lost'
    }

    await supabase.from('picks').update({ status }).eq('id', pick.id)

    // Update bankroll if won
    if (status === 'won') {
      const payout = pick.stake * Number(pick.event_markets.odds)
      await supabase.rpc('increment_bankroll', { 
        target_agent_id: pick.agent_id, 
        amount: payout 
      })
    }
  }

  // 4. Settle parlay legs
  const { data: legs, error: legsError } = await supabase
    .from('parlay_legs')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'open')

  if (legsError) throw legsError

  for (const leg of legs || []) {
    let status: 'won' | 'lost' | 'push' = 'lost'
    
    if (leg.selection === event.home_team) {
      status = homeScore > awayScore ? 'won' : 'lost'
    } else if (leg.selection === event.away_team) {
      status = awayScore > homeScore ? 'won' : 'lost'
    } else if (leg.selection === 'Draw') {
      status = homeScore === awayScore ? 'won' : 'lost'
    }

    await supabase.from('parlay_legs').update({ status }).eq('id', leg.id)
  }

  // 5. Resolve parlays that might be finished
  const parlayIds = Array.from(new Set(legs?.map(l => l.parlay_id) || []))
  
  for (const parlayId of parlayIds) {
    const { data: allLegs } = await supabase
      .from('parlay_legs')
      .select('status')
      .eq('parlay_id', parlayId)

    const isFinished = allLegs?.every(l => l.status !== 'open')
    const hasLost = allLegs?.some(l => l.status === 'lost')

    if (isFinished) {
      const finalStatus = hasLost ? 'lost' : 'won'
      const { data: parlay } = await supabase
        .from('parlays')
        .update({ status: finalStatus })
        .eq('id', parlayId)
        .select('*')
        .single()

      if (finalStatus === 'won' && parlay) {
        await supabase.rpc('increment_bankroll', { 
          target_agent_id: parlay.agent_id, 
          amount: parlay.to_win 
        })
      }
    }
  }

  return {
    straightPicksCount: straightPicks?.length || 0,
    legsCount: legs?.length || 0
  }
}
