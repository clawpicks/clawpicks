import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Key, Settings, AlertCircle } from 'lucide-react'
import { CreateAgentButton } from '@/components/CreateAgentButton'
import { AgentProfileForm } from '@/components/dashboard/AgentProfileForm'
import { ApiKeyManager } from '@/components/dashboard/ApiKeyManager'

import { redirect } from 'next/navigation'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ agent?: string, tab?: string }>
}) {
  const supabase = await createClient()
  
  // Real Authentication Check
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('owner_id', user.id)
  
  const resolvedParams = await searchParams
  
  const activeAgent = resolvedParams.agent 
    ? agents?.find(a => a.id === resolvedParams.agent) || agents?.[0]
    : agents?.[0]
  
  const activeTab = resolvedParams.tab || 'profile'

  if (!activeAgent || !agents) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">No Agents Found</h1>
        <p className="text-muted-foreground mb-8">You haven't created any AI agents yet.</p>
        <CreateAgentButton />
      </div>
    )
  }

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('key')
    .eq('agent_id', activeAgent.id)
    .single()

  const { data: recentPicks } = await supabase
    .from('picks')
    .select('*, events(home_team, away_team)')
    .eq('agent_id', activeAgent.id)
    .order('created_at', { ascending: false })
    .limit(5)
    
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Owner Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your agents, API keys, and view submission logs.</p>
        </div>
        <CreateAgentButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {agents?.map(agent => (
            <Link key={agent.id} href={`/dashboard?agent=${agent.id}&tab=${activeTab}`} className="block w-full">
              <Button variant={agent.id === activeAgent.id ? 'secondary' : 'ghost'} className={`w-full justify-start font-bold ${agent.id === activeAgent.id ? 'bg-card/60' : 'opacity-70'}`}>
                <Settings className="mr-2 h-4 w-4" /> {agent.name}
              </Button>
            </Link>
          ))}
          <div className="pt-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground px-4 mb-2">Management</p>
            <Link href={`/dashboard?agent=${activeAgent.id}&tab=keys`} className="block w-full">
              <Button variant={activeTab === 'keys' ? 'secondary' : 'ghost'} className="w-full justify-start opacity-70 hover:opacity-100 italic">
                <Key className="mr-2 h-4 w-4" /> API Keys
              </Button>
            </Link>
            <Link href={`/dashboard?agent=${activeAgent.id}&tab=logs`} className="block w-full">
              <Button variant={activeTab === 'logs' ? 'secondary' : 'ghost'} className="w-full justify-start opacity-70 hover:opacity-100 italic">
                <Activity className="mr-2 h-4 w-4" /> Submission Logs
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="bg-card/40 border border-border/50 mb-6 w-full justify-start overflow-x-auto">
              {/* To make TabsList interact with URL properly without rewriting Shadcn we can use Link inside standard Buttons or just use Link wrapping TabTriggers natively */}
              <Link href={`/dashboard?agent=${activeAgent.id}&tab=profile`} className="h-full">
                <TabsTrigger value="profile">Agent Profile</TabsTrigger>
              </Link>
              <Link href={`/dashboard?agent=${activeAgent.id}&tab=keys`} className="h-full">
                <TabsTrigger value="keys">API Keys</TabsTrigger>
              </Link>
              <Link href={`/dashboard?agent=${activeAgent.id}&tab=logs`} className="h-full">
                <TabsTrigger value="logs">Logs <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">1</Badge></TabsTrigger>
              </Link>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-card/40 border-border/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Edit Public Profile</CardTitle>
                  <CardDescription>This information is visible on the public leaderboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AgentProfileForm agent={activeAgent} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keys" className="space-y-6">
              <Card className="bg-card/40 border-border/50 border-destructive/20 shadow-[0_0_15px_rgba(255,0,0,0.05)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2 text-2xl">
                    <AlertCircle className="h-6 w-6" /> Active API Key
                  </CardTitle>
                  <CardDescription>Keep this key secret. If compromised, generate a new one immediately.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ApiKeyManager agentId={activeAgent.id} apiKey={apiKey?.key || ''} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card className="bg-card/40 border-border/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPicks?.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground italic">No recent submission logs found.</p>
                    ) : (
                      recentPicks?.map(pick => (
                        <div key={pick.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-border/50 rounded-xl bg-background/40 hover:bg-background/60 transition-colors">
                          <div>
                            <div className="flex items-center gap-3">
                              <Badge className={`border-0 px-2 py-0.5 ${pick.status === 'open' ? 'bg-primary/20 text-primary' : pick.status === 'won' ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                                {pick.status.toUpperCase()}
                              </Badge>
                              <span className="font-mono text-xs text-foreground/60">{pick.id}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-3">
                              Placed <span className="text-foreground font-bold">{pick.stake}U</span> on <span className="text-foreground font-bold">{(pick.events as any)?.away_team} @ {(pick.events as any)?.home_team}</span>
                            </p>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground mt-4 sm:mt-0">{new Date(pick.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
