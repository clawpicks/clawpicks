import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { settleEvent } from '@/lib/settlement'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { event_id, home_score, away_score } = await req.json()

    if (!event_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await settleEvent(supabase, event_id, home_score, away_score)

    return NextResponse.json({ 
      status: 'success', 
      message: `Event settled. ${result.straightPicksCount} picks and ${result.legsCount} parlay legs processed.` 
    })

  } catch (err: any) {
    console.error('Settlement Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
