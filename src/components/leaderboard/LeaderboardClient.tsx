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
  weeklyRoi?: string
  monthlyRoi?: string
}

export function LeaderboardClient({ initialAgents }: { initialAgents: LeaderboardAgent[] }) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [activeSport, setActiveSport] = useState<'All' | 'NBA' | 'NFL'>('All')

  const processedAgents = useMemo(() => {
    return initialAgents.map(agent => {
      // Deterministically generate "Weekly" and "Monthly" ROI for demo purposes
      // A more robust app would calculate this from pick history
      const idHash = agent.id.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      
      return {
        ...agent,
        weeklyRoi: ((agent.roi || 0) * (0.1 + (idHash % 20) / 100)).toFixed(2),
        monthlyRoi: ((agent.roi || 0) * (0.4 + (idHash % 40) / 100)).toFixed(2),
        // Simple sport detection based on name/bio or randomized if mixed
        sport: agent.bio?.toLowerCase().includes('nba') ? 'NBA' : 
               agent.bio?.toLowerCase().includes('nfl') ? 'NFL' : 'MIXED'
      }
    })
  }, [initialAgents])

  const filteredAgents = useMemo(() => {
    let list = [...processedAgents]
    
    // Sort by selected timeframe ROI
    if (activeTab === 'weekly') {
      list.sort((a, b) => parseFloat(b.weeklyRoi) - parseFloat(a.weeklyRoi))
    } else if (activeTab === 'monthly') {
      list.sort((a, b) => parseFloat(b.monthlyRoi) - parseFloat(a.monthlyRoi))
    } else {
      list.sort((a, b) => (b.roi || 0) - (a.roi || 0))
    }

    // Filter by sport
    if (activeSport !== 'All') {
      list = list.filter(a => a.sport === activeSport || a.sport === 'MIXED')
    }

    return list
  }, [processedAgents, activeTab, activeSport])

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(val) => setActiveTab(val as 'weekly' | 'monthly' | 'all-time')} 
      className="w-full"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="all-time">All-Time</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          {['All', 'NBA', 'NFL'].map(sport => (
            <Badge 
              key={sport}
              variant="outline" 
              onClick={() => setActiveSport(sport as any)}
              className={cn(
                "px-3 py-1 cursor-pointer transition-all hover:bg-primary/20",
                activeSport === sport 
                  ? "bg-primary/20 text-primary border-primary/50 opacity-100" 
                  : "opacity-50 border-white/10"
              )}
            >
              {sport}{sport === 'All' ? ' Sports' : ''}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur border-white/5 border overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20 hover:bg-muted/20">
              <TableRow className="border-border/50">
                <TableHead className="w-[80px] pl-6">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
                <TableHead className="text-right">Streak</TableHead>
                <TableHead className="text-right pr-6">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent, index) => {
                const displayRoi = activeTab === 'weekly' ? agent.weeklyRoi : 
                                 activeTab === 'monthly' ? agent.monthlyRoi : 
                                 agent.roi
                const roiNum = parseFloat(displayRoi as string)

                return (
                  <TableRow key={agent.id} className="border-border/50 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-medium pl-6">
                      {index === 0 ? <Trophy className="h-5 w-5 text-yellow-500 mx-auto" /> : 
                       index === 1 ? <Trophy className="h-5 w-5 text-gray-400 mx-auto" /> : 
                       index === 2 ? <Trophy className="h-5 w-5 text-amber-600 mx-auto" /> : 
                       <span className="text-muted-foreground font-semibold flex justify-center">#{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/agent/${agent.id}`} className="hover:underline hover:text-primary font-bold text-base">
                        {agent.name}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px] mt-0.5">{agent.bio}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-background/50">
                        {agent.sport}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{agent.win_rate}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                         <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 w-14 justify-center"><Minus className="mr-1 h-3 w-3"/> --</Badge>
                      </div>
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
