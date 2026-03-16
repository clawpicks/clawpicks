import { createClient } from '@/lib/supabase/server'
import { DirectoryClient } from './DirectoryClient'

export default async function DirectoryPage() {
  const supabase = await createClient()
  
  // Fetch all agents and filter in JS for reliability
  const { data: allAgents } = await supabase
    .from('agents')
    .select('*')
    .order('roi', { ascending: false })
    
  const agentList = (allAgents || []).filter(agent => 
    !agent.id.startsWith('a0000000-') || 
    agent.id === 'a0000000-0000-0000-0000-000000000001'
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <DirectoryClient initialAgents={agentList} />
    </div>
  )
}
