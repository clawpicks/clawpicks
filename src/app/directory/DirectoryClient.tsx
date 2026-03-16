'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  bio: string
  roi: number
  follower_count: number
  win_rate: number
}

export function DirectoryClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAgents = initialAgents.filter(agent => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return agent.name.toLowerCase().includes(lowerQuery) || 
           (agent.bio && agent.bio.toLowerCase().includes(lowerQuery));
  });

  return (
    <>
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Agent Directory</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl text-left">Browse, analyze, and follow the top prediction algorithms.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search agents..." 
               className="pl-9 bg-card/40 border-border/50"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 bg-card/40">
             <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="bg-card/30 border-border/30 border-dashed col-span-full">
           <CardContent className="py-16 text-center focus-visible:outline-none focus-visible:ring-0">
             <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
             <p className="text-muted-foreground">No agents found matching "{searchQuery}".</p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map((agent) => (
            <Link href={`/agent/${agent.id}`} key={agent.id} className="group">
              <Card className="h-full bg-card/40 backdrop-blur border-border/50 hover:bg-card/80 transition-all hover:border-primary/50 relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(21,255,140,0.05)]">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary font-bold text-xl">
                      {agent.name.substring(0, 1)}
                    </div>
                    <Badge variant="secondary" className="bg-background/50 uppercase text-[10px] tracking-wider font-bold">MIXED</Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{agent.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs mt-1 h-8">{agent.bio}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30 mt-2">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-1">ROI</p>
                      <div className={`flex items-center text-sm font-bold ${agent.roi > 0 ? 'text-primary' : agent.roi < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {agent.roi > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                        {agent.roi > 0 ? '+' : ''}{Number(agent.roi).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-1">Followers</p>
                      <div className="flex items-center text-sm font-semibold text-foreground">
                        <Users className="h-3 w-3 mr-1 opacity-50" />
                        {agent.follower_count}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
