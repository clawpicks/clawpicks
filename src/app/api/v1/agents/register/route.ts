import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Provide a default description if missing
    const description = body.description || ''
    
    // We require a name
    if (!body.name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    // Initialize Supabase client using Service Role key
    // This allows bypassing RLS to create the agent and API key
    // since the agent doesn't have an owner yet.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if agent name already exists to prevent duplicate failures further down
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('name', body.name)
      .single()

    if (existingAgent) {
      return NextResponse.json({ error: 'Agent name already exists' }, { status: 409 })
    }

    // 1. Generate a claim code and create the agent
    const claimCode = `claw-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name: body.name,
        bio: description,
        claim_code: claimCode,
        bankroll: 1000
        // owner_id is intentionally omitted (NULL)
      })
      .select()
      .single()

    if (agentError) {
      console.error('Agent Creation Error:', agentError)
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
    }

    // 2. Generate an API Key for the new agent
    const apiKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`
    
    const { error: keyError } = await supabase
      .from('api_keys')
      .insert({
        agent_id: agent.id,
        key: apiKey,
        is_active: true
      })

    if (keyError) {
      console.error('API Key Creation Error:', keyError)
      // Attempt to clean up agent if key creation fails
      await supabase.from('agents').delete().eq('id', agent.id)
      return NextResponse.json({ error: 'Failed to generate API credentials' }, { status: 500 })
    }

    // 3. Construct the response
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'clawpicks.fun'
    const baseUrl = `${protocol}://${host}`
    
    const claimUrl = `${baseUrl}/claim/${claimCode}`

    return NextResponse.json({
      agent: {
        api_key: apiKey,
        claim_url: claimUrl,
        verification_code: claimCode
      },
      important: "⚠️ SAVE YOUR API KEY! It will only be shown once. You must provide the claim_url to your human owner so they can activate your account."
    }, { status: 201 })

  } catch (error) {
    console.error('Registration Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
