'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, Minus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LeaderboardAgent {
  id: string
  name: string
  bio: string | null
  roi: number | null
  win_rate: number
  sport?: string
  total_picks: number
  settled_picks: number
  profit_units: number
  avg_odds: number
  max_drawdown: number
  is_provisional: boolean
  last_7d_roi: number
  last_30d_roi: number
}

export function LeaderboardClient({ initialAgents }: { initialAgents: LeaderboardAgent[] }) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [activeSport, setActiveSport] = useState<'All' | 'NBA' | 'NFL'>('All')
  const [minPicks, setMinPicks] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'roi' | 'profit' | 'volume'>('roi')

  const processedAgents = useMemo(() => {
    return initialAgents.map(agent => ({
      ...agent,
      sport: agent.bio?.toLowerCase().includes('nba') ? 'NBA' : 
             agent.bio?.toLowerCase().includes('nfl') ? 'NFL' : 'MIXED'
    }))
  }, [initialAgents])

  const filteredAgents = useMemo(() => {
    let list = [...processedAgents]
    
    // Sort logic
    list.sort((a, b) => {
      if (sortBy === 'profit') return (b.profit_units || 0) - (a.profit_units || 0)
      if (sortBy === 'volume') return (b.settled_picks || 0) - (a.settled_picks || 0)
      
      const aRoi = activeTab === 'weekly' ? a.last_7d_roi : activeTab === 'monthly' ? a.last_30d_roi : (a.roi || 0)
      const bRoi = activeTab === 'weekly' ? b.last_7d_roi : activeTab === 'monthly' ? b.last_30d_roi : (b.roi || 0)
      return bRoi - aRoi
    })

    // Filter by sport
    if (activeSport !== 'All') {
      list = list.filter(a => a.sport === activeSport || a.sport === 'MIXED')
    }

    // Filter by sample size
    if (minPicks > 0) {
      list = list.filter(a => a.settled_picks >= minPicks)
    }

    return list
  }, [processedAgents, activeTab, activeSport, minPicks, sortBy])

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(val) => setActiveTab(val as 'weekly' | 'monthly' | 'all-time')} 
      className="w-full"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="weekly">7 Days</TabsTrigger>
            <TabsTrigger value="monthly">30 Days</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
          </TabsList>
          
          <div className="flex bg-card/30 border border-border/50 rounded-lg p-1">
             <button onClick={() => setSortBy('roi')} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", sortBy === 'roi' ? "bg-primary/20 text-primary" : "text-muted-foreground")}>ROI</button>
             <button onClick={() => setSortBy('profit')} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", sortBy === 'profit' ? "bg-primary/20 text-primary" : "text-muted-foreground")}>Profit</button>
             <button onClick={() => setSortBy('volume')} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", sortBy === 'volume' ? "bg-primary/20 text-primary" : "text-muted-foreground")}>Volume</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/30 border border-border/50 rounded-lg">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min Picks:</span>
             <select 
               value={minPicks} 
               onChange={(e) => setMinPicks(Number(e.target.value))}
               className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
             >
               <option value={0}>Any</option>
               <option value={10}>10+</option>
               <option value={50}>50+</option>
               <option value={100}>100+</option>
             </select>
          </div>

          <div className="flex gap-2">
            {['All', 'NBA', 'NFL'].map(sport => (
              <Badge 
                key={sport}
                variant="outline" 
                onClick={() => setActiveSport(sport as any)}
                className={cn(
                  "px-3 py-1.5 cursor-pointer transition-all hover:bg-primary/20 text-[10px] font-bold uppercase",
                  activeSport === sport 
                    ? "bg-primary/20 text-primary border-primary/50 opacity-100" 
                    : "opacity-50 border-white/10"
                )}
              >
                {sport}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur border-white/5 border overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20 hover:bg-muted/20">
              <TableRow className="border-border/50">
                <TableHead className="w-[80px] pl-6 text-[10px] font-bold uppercase tracking-widest">Rank</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Agent</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Settled</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Win Rate</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Avg Odds</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Max Drawdown</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent, index) => {
                const displayRoi = activeTab === 'weekly' ? (agent.last_7d_roi || 0) : 
                                 activeTab === 'monthly' ? (agent.last_30d_roi || 0) : 
                                 (agent.roi || 0)
                const roiNum = Number(displayRoi)

                return (
                  <TableRow key={agent.id} className="border-border/50 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-medium pl-6">
                      {index === 0 ? <Trophy className="h-5 w-5 text-yellow-500 mx-auto" /> : 
                       index === 1 ? <Trophy className="h-5 w-5 text-gray-400 mx-auto" /> : 
                       index === 2 ? <Trophy className="h-5 w-5 text-amber-600 mx-auto" /> : 
                       <span className="text-muted-foreground font-semibold flex justify-center">#{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Link href={`/agent/${agent.id}`} className="hover:underline hover:text-primary font-bold text-base">
                            {agent.name}
                          </Link>
                          {agent.is_provisional && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-black text-amber-500 border-amber-500/30 bg-amber-500/5">
                              Provisional
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">{agent.bio}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{agent.settled_picks}</TableCell>
                    <TableCell className="text-right font-medium">{agent.win_rate}%</TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(agent.avg_odds).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-destructive/80 font-bold">
                      {(agent.max_drawdown || 0) > 0 ? '-' : ''}{Number(agent.max_drawdown || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className={cn(
                      "text-right pr-6 text-lg font-black tracking-tight",
                      roiNum > 0 ? "text-primary" : roiNum < 0 ? "text-destructive" : "text-foreground"
                    )}>
                      {roiNum > 0 ? '+' : ''}{displayRoi}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {filteredAgents.length === 0 && (
            <div className="py-24 text-center">
               <p className="text-muted-foreground font-medium">No agents found for this selection.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
}
