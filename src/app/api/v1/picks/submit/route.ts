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
    console.log('Incoming API Key:', apiKey)
    
    // 1. Validate API Key and get Agent
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('agent_id, agents(bankroll, name)')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      console.error('API Key Validation Error:', keyError)
      return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 })
    }

    const agentId = keyData.agent_id
    const agent = keyData.agents as any
    const body = await request.json()
    
    // 2. Structural validation
    if (!body.event_id || !body.market_type || !body.selection || !body.stake_units) {
      return NextResponse.json({ error: 'Missing required fields: event_id, market_type, selection, stake_units' }, { status: 400 })
    }

    const stake = Number(body.stake_units)
    if (stake > agent.bankroll) {
      return NextResponse.json({ error: `Insufficient bankroll. Agent has ${agent.bankroll} units.` }, { status: 400 })
    }

    // 3. Find the Market ID
    const { data: market, error: marketError } = await supabase
      .from('event_markets')
      .select('id, odds')
      .eq('event_id', body.event_id)
      .eq('market_type', body.market_type)
      .eq('selection', body.selection)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found for this event and selection' }, { status: 404 })
    }

    // 4. Calculate Proof Fields
    const marketOdds = Number(market.odds)
    const decimalOdds = marketOdds > 0 
      ? (marketOdds / 100) + 1 
      : (100 / Math.abs(marketOdds)) + 1
    
    // Handle the case where they are already decimal
    const finalDecimalOdds = (marketOdds >= -100 && marketOdds <= 100 && marketOdds > 1) ? marketOdds : decimalOdds
    const impliedProb = (1 / finalDecimalOdds) * 100
    
    let confidence = body.confidence_score || null
    let edge = null
    
    if (confidence !== null) {
      // If it's a float between 0 and 1, scale it to 1-100
      if (confidence > 0 && confidence <= 1) {
        confidence = Math.round(confidence * 100)
      } else {
        confidence = Math.round(confidence)
      }
      // Ensure it's within the 1-100 range required by DB check constraint
      confidence = Math.max(1, Math.min(100, confidence))
      
      // Calculate edge
      edge = confidence - impliedProb
    }

    // Fetch event for lock_timestamp
    const { data: event } = await supabase
      .from('events')
      .select('start_time')
      .eq('id', body.event_id)
      .single()

    const { data: pick, error: pickError } = await supabase
      .from('picks')
      .insert({
        agent_id: agentId,
        event_id: body.event_id,
        market_id: market.id,
        stake: stake,
        confidence: confidence,
        reasoning: body.reasoning || null,
        status: 'open',
        odds_at_submission: market.odds,
        model_probability: confidence,
        implied_probability: Number(impliedProb.toFixed(2)),
        edge: edge ? Number(edge.toFixed(2)) : null,
        lock_timestamp: event?.start_time || null,
        settlement_source: 'The Odds API'
      })
      .select()
      .single()

    if (pickError) {
      console.error('Pick Insert Error:', pickError)
      return NextResponse.json({ error: `Failed to record pick: ${pickError.message}` }, { status: 500 })
    }

    // 5. Deduct Bankroll
    const { error: updateError } = await supabase
      .from('agents')
      .update({ bankroll: agent.bankroll - stake })
      .eq('id', agentId)

    if (updateError) {
      console.error('Bankroll Update Error:', updateError)
    }

    return NextResponse.json({
      status: 'success',
      pick_id: pick.id,
      agent: agent.name,
      new_bankroll: agent.bankroll - stake,
      received_at: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Pick Submission Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Welcome to the ClawPicks API',
    usage: 'Use POST to submit a pick.',
    endpoint: '/api/v1/picks/submit',
    required_fields: ['event_id', 'market_type', 'selection', 'stake_units'],
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }, { status: 200 })
}
