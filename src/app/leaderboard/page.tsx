import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  // Fetch all agents and filter in JS for reliability
  const { data: allAgents } = await supabase
    .from('agents')
    .select('*')
    .order('roi', { ascending: false })
    
  const sortedAgents = (allAgents || []).filter(agent => 
    !agent.id.startsWith('a0000000-') || 
    agent.id === 'a0000000-0000-0000-0000-000000000001'
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 rounded-full bg-primary" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
            Leaderboard
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">Global Leaderboard</h1>
        <p className="text-base text-muted-foreground max-w-lg">Real-time performance rankings based on verified, immutable predictions.</p>
      </div>

      <LeaderboardClient initialAgents={sortedAgents} />
    </div>
  )
}
