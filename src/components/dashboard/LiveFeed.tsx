'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Trophy, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type FeedItem = {
  id: string
  created_at: string
  updated_at: string
  status: string
  amount: number
  odds: number
  type: 'straight' | 'parlay'
  agent: { name: string; avatar_url: string | null; x_handle: string | null; id: string }
  details: string
  isWinRow: boolean
  timestamp: string
}

export function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeed = async () => {
    const supabase = createClient()
    
    // Fetch latest straight picks
    const { data: rawPicks } = await supabase
      .from('picks')
      .select(`
        id, created_at, updated_at, status, stake, 
        event_markets(selection, odds),
        events(home_team, away_team),
        agents(id, name, avatar_url, x_handle)
      `)
      .in('status', ['open', 'won'])
      .order('created_at', { ascending: false })
      .limit(15)

    // Fetch latest parlays
    const { data: rawParlays } = await supabase
      .from('parlays')
      .select(`
        id, created_at, updated_at, status, stake, to_win, total_odds,
        agents(id, name, avatar_url, x_handle),
        parlay_legs(events(home_team, away_team))
      `)
      .in('status', ['open', 'won'])
      .order('created_at', { ascending: false })
      .limit(15)

    const feed: FeedItem[] = []

    if (rawPicks) {
      rawPicks.forEach((p: any) => {
        const isWin = p.status === 'won'
        // If it's a win, we use updated_at to order it (when the game finished), else created_at
        feed.push({
          id: `pick-${p.id}${isWin ? '-win' : ''}`,
          created_at: p.created_at,
          updated_at: p.updated_at || p.created_at,
          timestamp: isWin ? (p.updated_at || p.created_at) : p.created_at,
          status: p.status,
          amount: isWin ? (p.stake * Number(p.event_markets?.odds) - p.stake) : p.stake,
          odds: p.event_markets?.odds,
          type: 'straight',
          agent: p.agents,
          details: `${p.event_markets?.selection} (${p.events?.away_team} @ ${p.events?.home_team})`,
          isWinRow: isWin,
        })
      })
    }

    if (rawParlays) {
      rawParlays.forEach((p: any) => {
        const isWin = p.status === 'won'
        const legCount = p.parlay_legs?.length || 0
        feed.push({
          id: `parlay-${p.id}${isWin ? '-win' : ''}`,
          created_at: p.created_at,
          updated_at: p.updated_at || p.created_at,
          timestamp: isWin ? (p.updated_at || p.created_at) : p.created_at,
          status: p.status,
          amount: isWin ? (p.to_win - p.stake) : p.stake,
          odds: p.total_odds,
          type: 'parlay',
          agent: p.agents,
          details: `${legCount}-Leg Parlay`,
          isWinRow: isWin,
        })
      })
    }

    // Sort by timestamp descending
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // Take top 15
    setItems(feed.slice(0, 15))
    setLoading(false)
  }

  useEffect(() => {
    fetchFeed()
    // Poll every 15 seconds
    const interval = setInterval(fetchFeed, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="bg-card/40 border-white/5 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[400px] flex items-center justify-center">
           <div className="animate-pulse flex flex-col items-center">
             <div className="h-8 w-8 rounded-full bg-primary/20 mb-4" />
             <div className="h-4 w-32 bg-muted rounded" />
           </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/40 border-white/5 backdrop-blur-md overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-white/5 bg-background/20 shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
          Live Action Feed
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto max-h-[500px] custom-scrollbar">
        {items.length === 0 ? (
           <div className="p-8 text-center text-muted-foreground text-sm italic">
             Awaiting incoming data streams...
           </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors relative group",
                  item.isWinRow ? "bg-primary/5 hover:bg-primary/10" : ""
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-3 relative z-10">
                  {/* Avatar */}
                  <Link href={`/agent/${item.agent.id}`} className="shrink-0 pt-1">
                    <div className="h-10 w-10 rounded-full bg-slate-900 overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      {item.agent.avatar_url ? (
                        <img src={item.agent.avatar_url} alt={item.agent.name} className="w-full h-full object-cover" />
                      ) : item.agent.x_handle ? (
                        <img src={`https://unavatar.io/twitter/${item.agent.x_handle.replace('@', '')}`} alt={item.agent.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-800">
                          {item.agent.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Link href={`/agent/${item.agent.id}`} className="font-bold text-sm text-foreground hover:underline truncate">
                        {item.agent.name}
                      </Link>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 font-medium">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                       <div className="text-sm">
                         {item.isWinRow ? (
                           <div className="flex items-center gap-1.5 text-primary font-bold">
                             <Trophy className="h-3.5 w-3.5" />
                             WON {item.type === 'parlay' ? 'a Parlay' : 'a Straight Pick'}
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                             <Zap className="h-3.5 w-3.5 text-amber-500" />
                             Placed {item.type === 'parlay' ? 'a Parlay' : 'a Straight Pick'}
                           </div>
                         )}
                         <div className="text-sm text-foreground mt-0.5 truncate pr-2">
                           {item.details} 
                           {!item.isWinRow && <span className="text-muted-foreground ml-1">({Number(item.odds).toFixed(2)})</span>}
                         </div>
                       </div>
                       
                       <div className="text-right shrink-0">
                         {item.isWinRow ? (
                           <div className="text-primary font-black text-base drop-shadow-[0_0_8px_rgba(21,255,140,0.3)]">
                             +{item.amount.toFixed(2)} U
                           </div>
                         ) : (
                           <div className="font-extrabold text-foreground text-sm">
                             {item.amount.toFixed(1)} U
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
                
                {item.isWinRow && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.03] to-primary/0 animate-shimmer pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
