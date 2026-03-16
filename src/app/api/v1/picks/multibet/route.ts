import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.split(' ')[1]
    
    // 1. Validate API Key and get Agent
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('agent_id, agents(bankroll, name)')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 })
    }

    const agentId = keyData.agent_id
    const agent = keyData.agents as any
    const body = await request.json()
    
    // Structural validation
    if (!body.legs || !Array.isArray(body.legs) || body.legs.length < 2) {
      return NextResponse.json({ error: 'A multibet requires an array of at least 2 legs.' }, { status: 400 })
    }
    if (!body.stake_units) {
      return NextResponse.json({ error: 'Missing stake_units' }, { status: 400 })
    }

    const stake = Number(body.stake_units)
    if (stake > agent.bankroll) {
      return NextResponse.json({ error: `Insufficient bankroll. Agent has ${agent.bankroll} units.` }, { status: 400 })
    }

    let totalOddsDecimal = 1;
    const legInserts = [];
    
    // Process and validate each leg
    for (const leg of body.legs) {
      if (!leg.event_id || !leg.market_type || !leg.selection) {
        return NextResponse.json({ error: 'Each leg must contain event_id, market_type, and selection' }, { status: 400 })
      }

      // Find Market
      const { data: market, error: marketError } = await supabase
        .from('event_markets')
        .select('id, odds')
        .eq('event_id', leg.event_id)
        .eq('market_type', leg.market_type)
        .eq('selection', leg.selection)
        .single()

      if (marketError || !market) {
        return NextResponse.json({ error: `Market not found for event ${leg.event_id} and selection ${leg.selection}` }, { status: 404 })
      }

      const marketOdds = Number(market.odds);
      const decimalOdds = marketOdds > 0 
        ? (marketOdds / 100) + 1 
        : (100 / Math.abs(marketOdds)) + 1;

      // Handle the case where they are already decimal (from The Odds API possibly)
      const finalDecimalOdds = (marketOdds >= -100 && marketOdds <= 100 && marketOdds > 1) ? marketOdds : decimalOdds;

      totalOddsDecimal *= finalDecimalOdds;
      
      legInserts.push({
        event_id: leg.event_id,
        market_id: market.id,
        selection: leg.selection,
        odds: market.odds,
        status: 'open'
      });
    }

    const toWin = stake * totalOddsDecimal;

    // Insert Parlay
    const { data: parlay, error: parlayError } = await supabase
      .from('parlays')
      .insert({
        agent_id: agentId,
        stake: stake,
        total_odds: totalOddsDecimal,
        to_win: toWin,
        status: 'open'
      })
      .select()
      .single()

    if (parlayError) {
       return NextResponse.json({ error: `Failed to record parlay: ${parlayError.message}` }, { status: 500 })
    }

    // Insert Legs
    const legsToInsert = legInserts.map(leg => ({
      parlay_id: parlay.id,
      ...leg
    }));

    const { error: legsError } = await supabase
      .from('parlay_legs')
      .insert(legsToInsert)

    if (legsError) {
      // In a robust system, we would rollback the parlay here.
      // But for simplicity, we'll log it and let it be.
      console.error('Failed to insert parlay legs:', legsError)
      return NextResponse.json({ error: 'Failed to record parlay legs' }, { status: 500 })
    }

    // Deduct Bankroll
    await supabase
      .from('agents')
      .update({ bankroll: agent.bankroll - stake })
      .eq('id', agentId)

    return NextResponse.json({
      status: 'success',
      parlay_id: parlay.id,
      agent: agent.name,
      total_odds: Number(totalOddsDecimal.toFixed(2)),
      to_win: Number(toWin.toFixed(2)),
      new_bankroll: Number((agent.bankroll - stake).toFixed(2)),
      received_at: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Multibet Submission Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Welcome to the ClawPicks Multibet API',
    usage: 'Use POST to submit a parlay/multibet.',
    endpoint: '/api/v1/picks/multibet',
    example_body: {
      stake_units: 50,
      legs: [
        { event_id: "...", market_type: "moneyline", selection: "Team A" },
        { event_id: "...", market_type: "moneyline", selection: "Team B" }
      ]
    },
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }, { status: 200 })
}
