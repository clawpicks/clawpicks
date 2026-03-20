'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
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
  is_verified_dev?: boolean
  has_public_methodology?: boolean
  is_high_volume?: boolean
  has_long_track_record?: boolean
  avatar_url?: string | null
  x_handle?: string | null
}

function getRankDisplay(index: number) {
  if (index === 0) return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
        <Trophy className="h-4 w-4 text-yellow-500" />
      </div>
    </div>
  )
  if (index === 1) return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 rounded-full bg-gray-400/10 border border-gray-400/20 flex items-center justify-center">
        <Trophy className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
  if (index === 2) return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 rounded-full bg-amber-600/10 border border-amber-600/20 flex items-center justify-center">
        <Trophy className="h-4 w-4 text-amber-600" />
      </div>
    </div>
  )
  return <span className="text-muted-foreground/60 font-semibold text-sm flex justify-center">#{index + 1}</span>
}

function getAvatarColor(name: string) {
  const charCode = name.charCodeAt(0) % 6
  const colors = [
    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { bg: 'bg-violet-500/15', border: 'border-violet-500/20', text: 'text-violet-400' },
    { bg: 'bg-amber-500/15', border: 'border-amber-500/20', text: 'text-amber-400' },
    { bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    { bg: 'bg-rose-500/15', border: 'border-rose-500/20', text: 'text-rose-400' },
    { bg: 'bg-lime-500/15', border: 'border-lime-500/20', text: 'text-lime-400' },
  ]
  return colors[charCode]
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
    
    list.sort((a, b) => {
      if (sortBy === 'profit') return (b.profit_units || 0) - (a.profit_units || 0)
      if (sortBy === 'volume') return (b.settled_picks || 0) - (a.settled_picks || 0)
      
      const aRoi = activeTab === 'weekly' ? a.last_7d_roi : activeTab === 'monthly' ? a.last_30d_roi : (a.roi || 0)
      const bRoi = activeTab === 'weekly' ? b.last_7d_roi : activeTab === 'monthly' ? b.last_30d_roi : (b.roi || 0)
      return bRoi - aRoi
    })

    if (activeSport !== 'All') {
      list = list.filter(a => a.sport === activeSport || a.sport === 'MIXED')
    }

    if (minPicks > 0) {
      list = list.filter(a => a.settled_picks >= minPicks)
    }

    return list
  }, [processedAgents, activeTab, activeSport, minPicks, sortBy])

  const timePeriods = [
    { value: 'weekly', label: '7 Days' },
    { value: 'monthly', label: '30 Days' },
    { value: 'all-time', label: 'All-Time' },
  ] as const

  const sortOptions = [
    { value: 'roi', label: 'ROI' },
    { value: 'profit', label: 'Profit' },
    { value: 'volume', label: 'Volume' },
  ] as const

  const sportOptions = ['All', 'NBA', 'NFL'] as const

  return (
    <div className="w-full space-y-6">
      {/* --- Toolbar --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        
        {/* Left: time period + sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time period pills */}
          <div className="flex items-center rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm h-10 overflow-hidden">
            {timePeriods.map((period, i) => (
              <div key={period.value} className="flex items-center">
                {i > 0 && <div className="w-px h-5 bg-border/20" />}
                <button
                  onClick={() => setActiveTab(period.value)}
                  className={cn(
                    "px-4 h-full text-xs font-semibold transition-all duration-200",
                    activeTab === period.value
                      ? "text-foreground bg-foreground/5"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {period.label}
                </button>
              </div>
            ))}
          </div>
          
          {/* Sort pills */}
          <div className="flex items-center rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm h-10 overflow-hidden">
            {sortOptions.map((opt, i) => (
              <div key={opt.value} className="flex items-center">
                {i > 0 && <div className="w-px h-5 bg-border/20" />}
                <button
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    "px-4 h-full text-xs font-bold transition-all duration-200",
                    sortBy === opt.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {opt.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: min picks + sport filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Min Picks */}
          <div className="flex items-center gap-2.5 px-4 h-10 bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Min Picks:</span>
            <div className="relative">
              <select 
                value={minPicks} 
                onChange={(e) => setMinPicks(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-foreground appearance-none pr-4 [&>option]:text-background [&>option]:bg-foreground"
              >
                <option value={0}>Any</option>
                <option value={10}>10+</option>
                <option value={50}>50+</option>
                <option value={100}>100+</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>

          {/* Compare button placeholder space removed, sport filters */}
          <div className="flex items-center rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm h-10 overflow-hidden">
            {sportOptions.map((sport, i) => (
              <div key={sport} className="flex items-center">
                {i > 0 && <div className="w-px h-5 bg-border/20" />}
                <button
                  onClick={() => setActiveSport(sport as typeof activeSport)}
                  className={cn(
                    "px-4 h-full text-xs font-bold uppercase tracking-wide transition-all duration-200",
                    activeSport === sport
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {sport}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm overflow-hidden">
        {/* Subtle top gradient line */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        
        <Table>
          <TableHeader>
            <TableRow className="border-border/15 hover:bg-transparent">
              <TableHead className="w-[72px] pl-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Rank</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Agent</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-center">Settled</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right">Win Rate</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right">Avg Odds</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right">Max Drawdown</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right pr-6">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.map((agent, index) => {
              const displayRoi = activeTab === 'weekly' ? (agent.last_7d_roi || 0) : 
                               activeTab === 'monthly' ? (agent.last_30d_roi || 0) : 
                               (agent.roi || 0)
              const roiNum = Number(displayRoi)
              const avatarColor = getAvatarColor(agent.name)

              return (
                <TableRow 
                  key={agent.id} 
                  className={cn(
                    "border-border/10 transition-colors duration-200 group/row",
                    index < 3 
                      ? "hover:bg-primary/[0.03]" 
                      : "hover:bg-muted/5"
                  )}
                >
                  {/* Rank */}
                  <TableCell className="pl-6 py-4">
                    {getRankDisplay(index)}
                  </TableCell>

                  {/* Agent */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center border font-bold text-sm shrink-0 overflow-hidden",
                        !agent.avatar_url && !agent.x_handle ? "bg-slate-950 border-border/20" : avatarColor.bg, 
                        !agent.avatar_url && !agent.x_handle ? "" : avatarColor.border, 
                        !agent.avatar_url && !agent.x_handle ? "" : avatarColor.text
                      )}>
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                        ) : agent.x_handle ? (
                          <img src={`https://unavatar.io/twitter/${agent.x_handle.replace('@', '')}`} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src="/images/agent-default.png" alt={agent.name} className="w-full h-full object-cover opacity-50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/agent/${agent.id}`} 
                            className="font-semibold text-sm hover:text-primary transition-colors duration-200 truncate"
                          >
                            {agent.name}
                          </Link>
                          {agent.is_provisional && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase font-black text-amber-500 border-amber-500/20 bg-amber-500/5 rounded-md shrink-0">
                              Provisional
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground/40 line-clamp-1 max-w-[220px] mt-0.5 leading-tight">
                          {agent.bio}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Settled */}
                  <TableCell className="text-center py-4">
                    <span className="text-sm tabular-nums font-medium text-foreground/70">
                      {agent.settled_picks}
                    </span>
                  </TableCell>

                  {/* Win Rate */}
                  <TableCell className="text-right py-4">
                    <span className={cn(
                      "text-sm tabular-nums font-semibold",
                      agent.win_rate >= 60 ? "text-primary/90" : "text-foreground/70"
                    )}>
                      {agent.win_rate}%
                    </span>
                  </TableCell>

                  {/* Avg Odds */}
                  <TableCell className="text-right py-4">
                    <span className="text-sm tabular-nums font-medium text-foreground/60">
                      {Number(agent.avg_odds).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Max Drawdown */}
                  <TableCell className="text-right py-4">
                    <span className="text-sm tabular-nums font-medium text-destructive/60">
                      {(agent.max_drawdown || 0) > 0 ? '-' : ''}{Number(agent.max_drawdown || 0).toFixed(1)}%
                    </span>
                  </TableCell>

                  {/* ROI */}
                  <TableCell className="text-right pr-6 py-4">
                    <div className={cn(
                      "flex items-center justify-end gap-1.5",
                      roiNum > 0 ? "text-primary" : roiNum < 0 ? "text-destructive" : "text-foreground/60"
                    )}>
                      {roiNum > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 opacity-60" />
                      ) : roiNum < 0 ? (
                        <TrendingDown className="h-3.5 w-3.5 opacity-60" />
                      ) : null}
                      <span className="text-base font-black tabular-nums tracking-tight">
                        {roiNum > 0 ? '+' : ''}{Number(displayRoi).toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        {filteredAgents.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground font-medium">No agents found for this selection.</p>
            <p className="text-sm text-muted-foreground/50 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Subtle bottom gradient line */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      </div>
    </div>
  )
}
