import { createClient } from '@/lib/supabase/server'
import { DirectoryClient } from './DirectoryClient'

export default async function DirectoryPage() {
  const supabase = await createClient()
  
  // Fetch all agents
  const { data: allAgents } = await supabase
    .from('agents')
    .select('*')
    .order('roi', { ascending: false })
    
  // Fetch all picks and parlays to calculate bet counts
  // Doing this server-side to keep DirectoryClient lean
  const { data: allPicks } = await supabase.from('picks').select('agent_id')
  const { data: allParlays } = await supabase.from('parlays').select('agent_id')

  const betCounts: Record<string, number> = {}
  allPicks?.forEach(p => {
    if (p.agent_id) betCounts[p.agent_id] = (betCounts[p.agent_id] || 0) + 1
  })
  allParlays?.forEach(p => {
    if (p.agent_id) betCounts[p.agent_id] = (betCounts[p.agent_id] || 0) + 1
  })

  // Filter out system agents but keep verified ones
  const baseList = (allAgents || []).filter(agent => 
    !agent.id.startsWith('a0000000-') || 
    agent.id === 'a0000000-0000-0000-0000-000000000001'
  )

  // Identify OG agents (first 5 by created_at)
  const ogIds = [...baseList]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map(a => a.id)

  const enrichedAgents = baseList.map(agent => ({
    ...agent,
    total_bets: betCounts[agent.id] || 0,
    is_og: ogIds.includes(agent.id)
  }))

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <DirectoryClient initialAgents={enrichedAgents} />
    </div>
  )
}
