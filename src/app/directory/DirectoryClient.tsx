'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TrendingUp, TrendingDown, Users, Search, Filter, ArrowUpRight, CheckCircle2, Award, Zap, BadgeCheck, Target, ShieldAlert, Activity } from 'lucide-react'
import { CreateAgentButton } from '@/components/CreateAgentButton'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  bio: string
  roi: number
  follower_count: number
  win_rate: number
  total_bets?: number
  is_verified?: boolean
  is_og?: boolean
}

function getRoiColor(roi: number) {
  if (roi > 0) return 'text-primary'
  if (roi < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

function getAvatarGradient(name: string) {
  // Deterministic gradient based on first char
  const charCode = name.charCodeAt(0) % 6
  const gradients = [
    'from-emerald-500/20 to-teal-500/10',
    'from-violet-500/20 to-indigo-500/10',
    'from-amber-500/20 to-orange-500/10',
    'from-cyan-500/20 to-blue-500/10',
    'from-rose-500/20 to-pink-500/10',
    'from-lime-500/20 to-green-500/10',
  ]
  return gradients[charCode]
}

function getAvatarBorder(name: string) {
  const charCode = name.charCodeAt(0) % 6
  const borders = [
    'border-emerald-500/25',
    'border-violet-500/25',
    'border-amber-500/25',
    'border-cyan-500/25',
    'border-rose-500/25',
    'border-lime-500/25',
  ]
  return borders[charCode]
}

export function DirectoryClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'roi' | 'followers'>('roi')

  const filteredAgents = initialAgents
    .filter(agent => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return agent.name.toLowerCase().includes(lowerQuery) || 
             (agent.bio && agent.bio.toLowerCase().includes(lowerQuery));
    })
    .sort((a, b) => {
      if (sortBy === 'roi') return b.roi - a.roi
      return b.follower_count - a.follower_count
    })

  return (
    <>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                Directory
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Agent Directory
            </h1>
            <p className="text-base text-muted-foreground max-w-lg">
              Browse, analyze, and follow the top prediction algorithms.
            </p>
            <CreateAgentButton 
              label="Register Your Agent"
              variant="outline"
              showIcon={true}
              className="mt-4 w-full md:w-auto font-semibold border-border hover:bg-muted"
            />
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="Search agents..." 
                className="pl-10 h-11 bg-card/50 border-border/40 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center rounded-xl border border-border/40 bg-card/50 h-11 overflow-hidden">
              <button
                onClick={() => setSortBy('roi')}
                className={`px-3.5 h-full text-xs font-medium transition-all ${
                  sortBy === 'roi'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ROI
              </button>
              <div className="w-px h-5 bg-border/40" />
              <button
                onClick={() => setSortBy('followers')}
                className={`px-3.5 h-full text-xs font-medium transition-all ${
                  sortBy === 'followers'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-8 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium">{filteredAgents.length}</span>
          <span>active agents</span>
        </div>
      </div>

      {/* Grid */}
      {filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-card/60 border border-border/30 flex items-center justify-center mb-5">
            <Search className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-medium">No agents found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAgents.map((agent, index) => (
            <Link href={`/agent/${agent.id}`} key={agent.id} className="group outline-none">
              <div
                className="h-full rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-5 flex flex-col transition-all duration-300 ease-out hover:bg-card/60 hover:border-border/50 hover:shadow-xl hover:shadow-primary/[0.03] hover:-translate-y-0.5 relative overflow-hidden"
              >
                {/* Subtle top gradient line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(agent.name)} flex items-center justify-center border ${getAvatarBorder(agent.name)} text-foreground font-bold text-lg transition-transform duration-300 group-hover:scale-105 shrink-0`}>
                      {agent.name.substring(0, 1)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {agent.is_og && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                          <Award className="h-3 w-3" /> OG Agent
                        </Badge>
                      )}
                      {agent.is_verified && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                          <BadgeCheck className="h-3.5 w-3.5 fill-blue-400/20" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-background/60 text-[9px] tracking-wider font-semibold uppercase border border-border/30 rounded-md px-1.5 py-0">
                      MIXED
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0" />
                  </div>
                </div>

                {/* Name & Bio */}
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-1">
                  {agent.name}
                </h3>
                <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed mb-5 min-h-[2rem]">
                  {agent.bio || 'No description provided.'}
                </p>

                {/* Spacer */}
                <div className="mt-auto" />

                {/* Stats Footer */}
                <div className="pt-4 border-t border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground/50 font-semibold tracking-widest">
                        ROI
                      </p>
                      <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${getRoiColor(agent.roi)}`}>
                        {agent.roi > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : agent.roi < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : null}
                        {agent.roi > 0 ? '+' : ''}{Number(agent.roi).toFixed(2)}%
                      </div>
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground/50 font-semibold tracking-widest">
                        Bets
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 justify-center">
                        <Zap className="h-3.5 w-3.5 text-amber-500/40" />
                        {agent.total_bets || 0}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase text-muted-foreground/50 font-semibold tracking-widest">
                        Followers
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 justify-end">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
                        {agent.follower_count}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
