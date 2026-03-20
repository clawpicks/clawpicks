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
    const market = pick.event_markets
    const selection = market.selection

    if (market.market_type === 'moneyline') {
      if (selection === event.home_team) {
        status = homeScore > awayScore ? 'won' : 'lost'
      } else if (selection === event.away_team) {
        status = awayScore > homeScore ? 'won' : 'lost'
      } else if (selection === 'Draw') {
        status = homeScore === awayScore ? 'won' : 'lost'
      }
    } else if (market.market_type === 'spread') {
      // Parse point from selection "Team Name (+3.5)" or "Team Name (-3.5)"
      const pointMatch = selection.match(/\(([-+]?\d+\.?\d*)\)/)
      const point = pointMatch ? parseFloat(pointMatch[1]) : 0
      
      if (selection.startsWith(event.home_team)) {
        const adjustedScore = homeScore + point
        if (adjustedScore > awayScore) status = 'won'
        else if (adjustedScore < awayScore) status = 'lost'
        else status = 'push'
      } else if (selection.startsWith(event.away_team)) {
        const adjustedScore = awayScore + point
        if (adjustedScore > homeScore) status = 'won'
        else if (adjustedScore < homeScore) status = 'lost'
        else status = 'push'
      }
    }

    await supabase.from('picks').update({ 
      status,
      settled_at: new Date().toISOString()
    }).eq('id', pick.id)

    // Update bankroll if won or push
    if (status === 'won') {
      const payout = pick.stake * Number(market.odds)
      await supabase.rpc('increment_bankroll', { 
        target_agent_id: pick.agent_id, 
        amount: payout 
      })
    } else if (status === 'push') {
      // Return the stake if it's a push
      await supabase.rpc('increment_bankroll', { 
        target_agent_id: pick.agent_id, 
        amount: pick.stake 
      })
    }
  }

  // 4. Settle parlay legs
  const { data: legs, error: legsError } = await supabase
    .from('parlay_legs')
    .select('*, event_markets(*)') // Join to get market_type
    .eq('event_id', eventId)
    .eq('status', 'open')

  if (legsError) throw legsError

  for (const leg of legs || []) {
    let status: 'won' | 'lost' | 'push' = 'lost'
    const market = leg.event_markets
    const selection = leg.selection
    
    if (market.market_type === 'moneyline') {
      if (selection === event.home_team) {
        status = homeScore > awayScore ? 'won' : 'lost'
      } else if (selection === event.away_team) {
        status = awayScore > homeScore ? 'won' : 'lost'
      } else if (selection === 'Draw') {
        status = homeScore === awayScore ? 'won' : 'lost'
      }
    } else if (market.market_type === 'spread') {
      const pointMatch = selection.match(/\(([-+]?\d+\.?\d*)\)/)
      const point = pointMatch ? parseFloat(pointMatch[1]) : 0
      
      if (selection.startsWith(event.home_team)) {
        const adjustedScore = homeScore + point
        if (adjustedScore > awayScore) status = 'won'
        else if (adjustedScore < awayScore) status = 'lost'
        else status = 'push'
      } else if (selection.startsWith(event.away_team)) {
        const adjustedScore = awayScore + point
        if (adjustedScore > homeScore) status = 'won'
        else if (adjustedScore < homeScore) status = 'lost'
        else status = 'push'
      }
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
        .update({ 
          status: finalStatus,
          settled_at: new Date().toISOString()
        })
        .eq('id', parlayId)
        .select('*')
        .single()

      if (finalStatus === 'won' && parlay) {
        await supabase.rpc('increment_bankroll', { 
          target_agent_id: parlay.agent_id, 
          amount: parlay.to_win 
        })
      }
      
      // Refresh parlay agent stats
      if (parlay) {
        await supabase.rpc('refresh_agent_stats', { 
          target_agent_id: parlay.agent_id 
        })
      }
    }
  }

  // 6. Refresh stats for all involved agents in straight picks
  const straightAgentIds = Array.from(new Set(straightPicks?.map(p => p.agent_id) || []))
  for (const agentId of straightAgentIds) {
    await supabase.rpc('refresh_agent_stats', { 
      target_agent_id: agentId 
    })
  }

  return {
    straightPicksCount: straightPicks?.length || 0,
    legsCount: legs?.length || 0
  }
}
