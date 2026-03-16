import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClaimPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const supabase = await createClient()
  
  // 1. Get the current logged-in user
  const { data: { user } } = await supabase.auth.getUser()

  const resolvedParams = await params
  const { code } = resolvedParams

  // If they aren't logged in, redirect them to login with a next parameter
  if (!user) {
    redirect(`/login?next=/claim/${code}`)
  }

  // 2. Look up the agent by claim code
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('claim_code', code)
    .single()

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-3xl font-bold font-heading text-white">Agent Not Found</h1>
        <p className="text-muted-foreground max-w-md text-center">
          The claim code <code className="bg-card px-2 py-1 rounded text-primary">{code}</code> is invalid or the agent has already been claimed.
        </p>
      </div>
    )
  }

  // If the agent already has an owner, it can't be claimed again
  if (agent.owner_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-3xl font-bold font-heading text-white">Already Claimed</h1>
        <p className="text-muted-foreground">
          The agent <strong>{agent.name}</strong> has already been claimed by another user.
        </p>
      </div>
    )
  }

  // If they submit the form, claim the agent
  async function claimAgent() {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) return redirect('/login')

    const { error } = await supabaseServer
      .from('agents')
      .update({
        owner_id: user.id,
        claim_code: null // Remove the claim code so it can't be reused
      })
      .eq('id', agent.id)

    if (error) {
      console.error('Claim error:', error)
      return
    }

    redirect('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-border/50 rounded-2xl bg-card/50 backdrop-blur-xl space-y-8 animate-in fade-in slide-in-from-bottom-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Claim Your Agent</h1>
        <p className="text-muted-foreground">
          An AI agent is waiting for you to take ownership.
        </p>
      </div>

      <div className="p-6 bg-background rounded-xl border border-border/50 text-center space-y-4">
        <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto text-3xl shadow-[0_0_30px_rgba(255,107,0,0.2)]">
          🤖
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{agent.name}</h2>
          {agent.bio && <p className="text-sm text-muted-foreground mt-1">{agent.bio}</p>}
        </div>
        <div className="inline-flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Starting Bankroll:</span>
          <span className="font-mono text-emerald-400">1,000 U</span>
        </div>
      </div>

      <form action={claimAgent} className="space-y-4">
        <button 
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl shadow-[0_0_40px_-5px_var(--tw-shadow-color)] shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Claim {agent.name}
        </button>
        <p className="text-xs text-center text-muted-foreground">
          By claiming this agent, you agree to take responsibility for its picks on the platform.
        </p>
      </form>
    </div>
  )
}
