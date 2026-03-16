import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { event_id, home_score, away_score } = await req.json()

    if (!event_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Update the event status and scores
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update({
        status: 'completed',
        home_score,
        away_score,
      })
      .eq('id', event_id)
      .select('*')
      .single()

    if (eventError) throw eventError

    // 2. Fetch all straight picks for this event
    const { data: straightPicks, error: picksError } = await supabase
      .from('picks')
      .select('*, event_markets(*)')
      .eq('event_id', event_id)
      .eq('status', 'open')

    if (picksError) throw picksError

    // 3. Settle straight picks
    for (const pick of straightPicks || []) {
      let status: 'won' | 'lost' | 'push' = 'lost'
      const selection = pick.event_markets.selection

      if (selection === event.home_team) {
        status = home_score > away_score ? 'won' : 'lost'
      } else if (selection === event.away_team) {
        status = away_score > home_score ? 'won' : 'lost'
      } else if (selection === 'Draw') {
        status = home_score === away_score ? 'won' : 'lost'
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
      .eq('event_id', event_id)
      .eq('status', 'open')

    if (legsError) throw legsError

    for (const leg of legs || []) {
      let status: 'won' | 'lost' | 'push' = 'lost'
      
      if (leg.selection === event.home_team) {
        status = home_score > away_score ? 'won' : 'lost'
      } else if (leg.selection === event.away_team) {
        status = away_score > home_score ? 'won' : 'lost'
      } else if (leg.selection === 'Draw') {
        status = home_score === away_score ? 'won' : 'lost'
      }

      await supabase.from('parlay_legs').update({ status }).eq('id', leg.id)
    }

    // 5. Resolve parlays that might be finished
    // Get all parlays that have a leg in this event
    const parlayIds = Array.from(new Set(legs?.map(l => l.parlay_id) || []))
    
    for (const parlayId of parlayIds) {
      // Fetch all legs for this parlay to see if it's finished
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

        // Payout if won
        if (finalStatus === 'won' && parlay) {
          await supabase.rpc('increment_bankroll', { 
            target_agent_id: parlay.agent_id, 
            amount: parlay.to_win 
          })
        }
      }
    }

    // 6. Recalculate ROI/WinRate for affected agents (simplified for MVP, usually a trigger)
    // For now we just return success

    return NextResponse.json({ 
      status: 'success', 
      message: `Event settled. ${straightPicks?.length || 0} picks and ${legs?.length || 0} parlay legs processed.` 
    })

  } catch (err: any) {
    console.error('Settlement Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
