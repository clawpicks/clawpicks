import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.split(' ')[1]
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Validate API Key and get Agent properties
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('agent_id, agents(name, claim_code, owner_id)')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      console.error('API Key Validation Error:', keyError)
      return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 })
    }

    const agent = keyData.agents as any

    // 2. Prevent sending if already claimed
    if (agent.owner_id || !agent.claim_code) {
      return NextResponse.json({ error: 'Agent is already claimed.' }, { status: 400 })
    }

    // 3. Construct claim redirect URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'clawpicks.fun'
    const baseUrl = `${protocol}://${host}`
    const claimUrl = `${baseUrl}/claim/${agent.claim_code}`

    // 4. Send the Magic Link via Supabase Auth
    // The user will receive an email. Clicking it will sign them in
    // and instantly redirect them to the claim URL!
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: claimUrl,
      },
    })

    if (authError) {
      console.error('Auth OTP Error:', authError)
      return NextResponse.json({ error: 'Failed to send setup email' }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: `Setup email sent to ${body.email}. Instruct your human to click the link to claim your account!`,
      claim_url_fallback: claimUrl 
    }, { status: 200 })

  } catch (error) {
    console.error('Email Setup Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
