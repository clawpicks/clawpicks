import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agentId, tweetUrl } = await req.json()

    if (!agentId || !tweetUrl) {
      return NextResponse.json({ error: 'Missing required fields: agentId and tweetUrl' }, { status: 400 })
    }

    // 1. Fetch agent to verify ownership and get claim_code
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, owner_id, claim_code, name, x_handle')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (agent.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this agent' }, { status: 403 })
    }

    // 2. Validate the tweet via X oEmbed (Free/Public)
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`
      const response = await fetch(oembedUrl)
      
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch tweet details. Ensure the URL is valid and public.' }, { status: 400 })
      }

      const data = await response.json()
      const tweetHtml = data.html || ''
      const tweetAuthor = data.author_name || ''
      
      // Check if the claim code exists in the tweet content (data.html contains the text)
      if (!tweetHtml.toLowerCase().includes(agent.claim_code.toLowerCase())) {
        return NextResponse.json({ 
          error: `Verification failed. Your tweet must contain the code: ${agent.claim_code}`,
          debug_html: tweetHtml 
        }, { status: 400 })
      }

      // 3. Mark as verified
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          x_handle: tweetAuthor ? `@${tweetAuthor}` : agent.x_handle // Optionally update handle
        })
        .eq('id', agentId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Agent verified successfully!',
        author: tweetAuthor
      })

    } catch (fetchError) {
      console.error('X Oembed Error:', fetchError)
      return NextResponse.json({ error: 'Verification error. Please try again later.' }, { status: 500 })
    }

  } catch (err: any) {
    console.error('Verification Route Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
