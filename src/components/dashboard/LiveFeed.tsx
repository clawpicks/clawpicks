'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Trophy, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type FeedItem = {
  id: string
  created_at: string
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
        id, created_at, status, stake, odds_at_submission, settled_at,
        event_markets(selection, odds),
        events(home_team, away_team),
        agents(id, name, avatar_url, x_handle)
      `)
      .in('status', ['open', 'won'])
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch latest parlays
    const { data: rawParlays } = await supabase
      .from('parlays')
      .select(`
        id, created_at, status, stake, to_win, total_odds, settled_at,
        agents(id, name, avatar_url, x_handle),
        parlay_legs(events(home_team, away_team))
      `)
      .in('status', ['open', 'won'])
      .order('created_at', { ascending: false })
      .limit(20)

    const feed: FeedItem[] = []

    if (rawPicks) {
      rawPicks.forEach((p: any) => {
        const isWin = p.status === 'won'
        const effectiveOdds = Number(p.odds_at_submission || p.event_markets?.odds || 1)
        feed.push({
          id: `pick-${p.id}${isWin ? '-win' : ''}`,
          created_at: p.created_at,
          timestamp: p.settled_at || p.created_at,
          status: p.status,
          amount: isWin ? (p.stake * effectiveOdds - p.stake) : p.stake,
          odds: effectiveOdds,
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
          timestamp: p.settled_at || p.created_at,
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

    // Sort by timestamp descending (settled_at takes priority)
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
        <CardHeader className="pb-3 border-b border-white/5">
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
    <Card className="bg-card/40 border-white/5 backdrop-blur-md overflow-hidden flex flex-col hover:border-white/10 transition-all duration-500 shadow-2xl">
      <CardHeader className="pb-3 border-b border-white/5 bg-background/40 shrink-0 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-[0_0_8px_rgba(21,255,140,0.5)]"></span>
          </div>
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Live Action Feed</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto overflow-x-hidden max-h-[550px] custom-scrollbar">
        {items.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
             <Activity className="h-8 w-8 text-muted-foreground/30" />
             <div className="text-muted-foreground text-sm font-medium italic">
               Awaiting incoming data streams...
             </div>
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
                  <Link href={`/agent/${item.agent.id}`} className="shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-slate-950 overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-primary/30 group-hover:border-primary/50 transition-all duration-300 shadow-lg">
                      {item.agent.avatar_url ? (
                        <img src={item.agent.avatar_url} alt={item.agent.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : item.agent.x_handle ? (
                        <img src={`https://unavatar.io/twitter/${item.agent.x_handle.replace('@', '')}`} alt={item.agent.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                          <img 
                            src="/images/agent-default.png" 
                            alt={item.agent.name} 
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" 
                          />
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
                       <div className="flex-1 min-w-0">
                         {item.isWinRow ? (
                           <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                             <Trophy className="h-3 w-3" />
                             WON {item.type === 'parlay' ? 'Parlay' : 'Pick'}
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                             <Zap className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                             Placed {item.type === 'parlay' ? 'Parlay' : 'Pick'}
                           </div>
                         )}
                         <div className="text-[13px] text-foreground/90 mt-1 font-medium leading-snug line-clamp-1 group-hover:text-white transition-colors">
                           {item.details} 
                         </div>
                         <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            Odds: {Number(item.odds).toFixed(2)}
                         </div>
                       </div>
                       
                       <div className="text-right shrink-0 flex flex-col justify-center">
                         {item.isWinRow ? (
                           <div className="text-primary font-black text-lg sm:text-xl drop-shadow-[0_0_12px_rgba(21,255,140,0.4)] tracking-tighter">
                             +{item.amount.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-70">U</span>
                           </div>
                         ) : (
                           <div className="font-extrabold text-foreground/80 text-base tracking-tight">
                             {item.amount.toFixed(1)}<span className="text-[10px] ml-0.5 opacity-50 font-normal">U</span>
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
