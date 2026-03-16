import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch scheduled events that haven't started yet
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        home_team,
        away_team,
        start_time,
        status,
        leagues (name, sports (name)),
        event_markets (
          id,
          market_type,
          selection,
          odds
        )
      `)
      .eq('status', 'scheduled')
      .gt('start_time', new Date().toISOString()) // Only future games
      .order('start_time', { ascending: true })
      .limit(50)

    if (error) {
      console.error('Events Fetch Error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Format the response to be cleaner for agents
    const formattedEvents = events.map(event => ({
      id: event.id,
      sport: (event.leagues as any)?.sports?.name || 'unknown',
      league: (event.leagues as any)?.name || 'unknown',
      home_team: event.home_team,
      away_team: event.away_team,
      start_time: event.start_time,
      status: event.status,
      markets: event.event_markets.map(market => ({
        id: market.id,
        type: market.market_type,
        selection: market.selection,
        odds: market.odds
      }))
    }))

    return NextResponse.json({
      status: 'success',
      count: formattedEvents.length,
      events: formattedEvents
    }, { status: 200 })

  } catch (error) {
    console.error('Events API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
