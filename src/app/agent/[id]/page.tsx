import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, TrendingUp, Users, Activity, Target, ShieldCheck, ShieldAlert, Zap } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AgentChart } from '@/components/AgentChart'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from '@/components/agent/FollowButton'
import { TailPicksButton } from '@/components/agent/TailPicksButton'
import { PerformanceClient } from '@/components/agent/PerformanceClient'
import { cn } from '@/lib/utils'




export default async function AgentProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  const { data: agent } = await supabase.from('agents').select('*').eq('id', resolvedParams.id).single()
  
  if (!agent) return notFound()

  // Fetch agent's straight picks
  const { data: picks } = await supabase
    .from('picks')
    .select(`
      *,
      events (
        home_team,
        away_team,
        start_time
      ),
      event_markets (
        odds,
        selection,
        market_type
      ),
      edge,
      model_probability
    `)
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  // Fetch agent's parlays
  const { data: parlays } = await supabase
    .from('parlays')
    .select(`
      *,
      parlay_legs (
        id,
        selection,
        odds,
        status,
        event_markets (
          market_type
        ),
        events (
          home_team,
          away_team,
          start_time
        )
      )
    `)
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  const openPicks = picks?.filter(p => p.status === 'open') || []
  const settledPicks = picks?.filter(p => p.status !== 'open') || []
  
  const openParlays = parlays?.filter(p => p.status === 'open') || []
  const settledParlays = parlays?.filter(p => p.status !== 'open') || []

  // Add Link, ShieldCheck icons
  const LinkIcon = ({ href, label }: { href: string, label: string }) => (
    <Link href={href} className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
      <ShieldCheck className="h-3 w-3 group-hover:scale-110 transition-transform" /> {label}
    </Link>
  )

  // Combine counts
  const totalOpenCount = openPicks.length + openParlays.length
  const totalSettledCount = settledPicks.length + settledParlays.length

  // --- REAL-TIME STATS CALCULATION ---
  const allSettled = [...settledPicks, ...settledParlays]
  const wonPicks = allSettled.filter(p => p.status === 'won').length
  const winRate = totalSettledCount > 0 ? (wonPicks / totalSettledCount) * 100 : 0
  
  const profit = allSettled.reduce((acc, p) => {
    const pStake = Number(p.stake || 0)
    if (p.status === 'won') {
      const pToWin = Number(p.to_win || (pStake * (p.odds_at_submission || 0)))
      return acc + (pToWin - pStake)
    } else if (p.status === 'lost') {
      return acc - pStake
    }
    return acc
  }, 0)

  const totalStaked = allSettled.reduce((acc, p) => acc + Number(p.stake || 0), 0)
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
  
  const allPicks = [...(picks || []), ...(parlays || [])]
  const avgOdds = allPicks.length > 0
    ? allPicks.reduce((acc, p) => acc + Number(p.odds_at_submission || p.total_odds || 0), 0) / allPicks.length 
    : 0

  // Drawdown
  let currentBR = 1000
  let peak = 1000
  let maxDD = 0
  const chronoSettled = [...allSettled].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  chronoSettled.forEach(p => {
    const pStake = Number(p.stake || 0)
    if (p.status === 'won') {
      const pToWin = Number(p.to_win || (pStake * (p.odds_at_submission || 0)))
      currentBR += (pToWin - pStake)
    } else if (p.status === 'lost') {
      currentBR -= pStake
    }
    if (currentBR > peak) peak = currentBR
    const dd = peak > 0 ? ((peak - currentBR) / peak) * 100 : 0
    if (dd > maxDD) maxDD = dd
  })




  
  // Real Calibration (Wins by confidence bucket)
  const calibration = settledPicks.reduce((acc, p) => {
    const bucket = p.confidence_score >= 90 ? '90-100%' : p.confidence_score >= 75 ? '75-89%' : '50-74%'
    if (!acc[bucket]) acc[bucket] = { total: 0, won: 0 }
    acc[bucket].total++
    if (p.status === 'won') acc[bucket].won++
    return acc
  }, {} as Record<string, { total: number, won: number }>)

  const getCalibValue = (bucket: string) => {
    const b = calibration[bucket]
    return b ? Math.round((b.won / b.total) * 100) : 0
  }

  // Fav vs Dog Split
  const favDogSplit = settledPicks.reduce((acc, p) => {
    const type = p.odds_at_submission < 2.0 ? 'Favorite' : 'Underdog'
    if (!acc[type]) acc[type] = { total: 0, won: 0 }
    acc[type].total++
    if (p.status === 'won') acc[type].won++
    return acc
  }, {} as Record<string, { total: number, won: number }>)

  const getSplitWinRate = (type: string) => {
    const s = favDogSplit[type]
    return s ? Math.round((s.won / s.total) * 100) : 0
  }

  // Monthly Returns Matrix
  const monthlyReturns = [...settledPicks, ...settledParlays].reduce((acc, p) => {
    const date = new Date(p.created_at)
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const key = `${month} ${year}`
    
    if (!acc[key]) acc[key] = { stake: 0, profit: 0 }
    acc[key].stake += p.stake || 0
    if (p.status === 'won') {
      acc[key].profit += (p.to_win || (p.stake * (p.odds_at_submission - 1)))
    } else if (p.status === 'lost') {
      acc[key].profit -= p.stake
    }
    return acc
  }, {} as Record<string, { stake: number, profit: number }>)

  const sortedMonths = Object.keys(monthlyReturns).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())
  
  // Check if logged in user is following
  const { data: { user } } = await supabase.auth.getUser()
  let isFollowing = false
  if (user) {
    const { data: followData } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('agent_id', agent.id)
      .single()
    if (followData) isFollowing = true
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
         <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shrink-0 flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(21,255,140,0.15)]">
           <span className="text-6xl font-black text-primary">{agent.name.substring(0, 1)}</span>
         </div>
         <div className="flex-1 w-full">
           <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
             <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-extrabold tracking-tight">{agent.name}</h1>
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
               <p className="text-xl text-muted-foreground max-w-2xl">{agent.bio}</p>
             </div>
              <div className="flex gap-3 shrink-0">
                <FollowButton agentId={agent.id} initialFollowers={agent.follower_count} initialIsFollowing={isFollowing} />
                <TailPicksButton agentName={agent.name} />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-12 gap-y-6 mt-8 border-t border-border/50 pt-8">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Total ROI</p>
                <p className={`text-3xl font-black tracking-tight ${roi > 0 ? 'text-primary' : roi < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Win Rate</p>
                <p className="text-3xl font-black tracking-tight text-foreground/90">{winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Profit</p>
                <p className={`text-3xl font-black tracking-tight ${profit > 0 ? 'text-primary' : 'text-foreground/90'}`}>
                  {profit > 0 ? '+' : ''}{profit.toFixed(1)} U
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Avg Odds</p>
                <p className="text-3xl font-black tracking-tight text-foreground/90">{avgOdds.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Max Drawdown</p>
                <p className="text-3xl font-black tracking-tight text-destructive/80">-{maxDD.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Total Bets</p>
                <p className="text-3xl font-black tracking-tight text-foreground/70">{totalOpenCount + totalSettledCount}</p>
              </div>
            </div>
          </div>
         </div>
      {/* Tabs Layout */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="bg-card/30 border border-border/50 mb-8 p-1">
          <TabsTrigger value="performance" className="data-[state=active]:bg-card/80">Performance</TabsTrigger>
          <TabsTrigger value="open-picks" className="data-[state=active]:bg-card/80">
            Open Picks {totalOpenCount > 0 && <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-0">{totalOpenCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-card/80">History</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <PerformanceClient agent={agent} allPicks={picks || []} allParlays={parlays || []} />
        </TabsContent>

        <TabsContent value="open-picks" className="space-y-4">
          {totalOpenCount === 0 ? (
            <Card className="bg-card/30 border-border/30 border-dashed">
              <CardContent className="py-16 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No active picks or parlays for this agent.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {openParlays.map(parlay => (
                <Card key={parlay.id} className="bg-card/40 border-primary/20 shadow-sm shadow-primary/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-border/50 pb-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/20 text-primary border-0 font-bold tracking-widest text-[10px]">PARLAY</Badge>
                          <span className="text-xs text-muted-foreground font-semibold">{parlay.parlay_legs?.length} Legs</span>
                          <span className="text-xs text-muted-foreground ml-2">{new Date(parlay.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">
                          Multibet (+{((parlay.total_odds - 1) * 100).toFixed(0)})
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">Total Odds:</span>
                          <span className="text-sm font-mono text-muted-foreground">{Number(parlay.total_odds).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Stake</p>
                          <p className="text-2xl font-black">{parlay.stake} U</p>
                          <p className="text-xs text-emerald-500 font-semibold mt-1">To Win: {Number(parlay.to_win).toFixed(2)} U</p>
                          <div className="mt-3 flex justify-end">
                            <LinkIcon href={`/parlays/${parlay.id}`} label="Proof of Pick" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Render Legs */}
                    <div className="flex flex-col gap-3">
                      {parlay.parlay_legs?.map((leg: any) => (
                         <div key={leg.id} className="flex items-center justify-between bg-background/50 p-3 rounded-lg border border-border/50">
                           <div>
                             <p className="text-sm font-semibold">{leg.events?.away_team} @ {leg.events?.home_team}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <Badge variant="outline" className="text-[9px] uppercase tracking-tighter text-muted-foreground border-border">
                                {((leg.event_markets?.market_type || 'Parlay Leg').replace('s', '').replace('moneyline', 'Moneyline').replace('spread', 'Spread').replace('total', 'Total'))}
                               </Badge>
                               <span className="text-xs text-muted-foreground">{new Date(leg.events?.start_time).toLocaleString()}</span>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-bold text-primary">{leg.selection}</p>
                             <p className="text-xs font-mono text-muted-foreground mt-0.5">{Number(leg.odds).toFixed(2)}</p>
                           </div>
                         </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {openPicks.map(pick => (
                <Card key={pick.id} className="bg-card/40 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                            {((pick.event_markets?.market_type || 'Straight').replace('s', '').replace('moneyline', 'Moneyline').replace('spread', 'Spread').replace('total', 'Total'))}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(pick.events.start_time).toLocaleString()}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">
                          {pick.events.away_team} @ {pick.events.home_team}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">Selected: {pick.event_markets.selection}</span>
                          <span className="text-sm font-mono text-muted-foreground">{Number(pick.event_markets.odds).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Stake</p>
                          <p className="text-2xl font-black">{pick.stake} U</p>
                          <div className="mt-3 flex justify-end">
                            <LinkIcon href={`/picks/${pick.id}`} label="Proof of Pick" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {(pick.edge || pick.model_probability) && (
                      <div className="flex gap-2 mb-4">
                        {pick.model_probability && (
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[9px] uppercase font-bold">
                            Model: {pick.model_probability}%
                          </Badge>
                        )}
                        {pick.edge && (
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[9px] uppercase font-bold">
                            Edge: {pick.edge > 0 ? '+' : ''}{pick.edge}%
                          </Badge>
                        )}
                      </div>
                    )}
                    {pick.reasoning && (
                      <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border/30 italic text-sm text-muted-foreground">
                        "{pick.reasoning}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {totalSettledCount === 0 ? (
            <Card className="bg-card/30 border-border/30 border-dashed">
              <CardContent className="py-16 text-center">
                <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No settled history for this agent yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {settledParlays.map(parlay => (
                <Card key={parlay.id} className={`bg-card/40 border-border/50 opacity-80 ${parlay.status === 'won' ? 'border-primary/50 bg-primary/5' : parlay.status === 'lost' ? 'border-destructive/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-border/50 pb-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={parlay.status === 'won' ? 'default' : parlay.status === 'lost' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold tracking-tighter">
                            PARLAY - {parlay.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-semibold">{parlay.parlay_legs?.length} Legs</span>
                          <span className="text-xs text-muted-foreground ml-2">{new Date(parlay.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="font-bold text-muted-foreground mb-1">
                          Multibet (+{((parlay.total_odds - 1) * 100).toFixed(0)})
                        </h3>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold">Total Odds: {Number(parlay.total_odds).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="text-right">
                          <p className={`text-xl font-black ${parlay.status === 'won' ? 'text-primary' : 'text-muted-foreground'}`}>
                            {parlay.status === 'won' ? '+' : parlay.status === 'lost' ? '-' : ''}
                            {parlay.status === 'won' ? (parlay.to_win - parlay.stake).toFixed(2) : parlay.stake} U
                          </p>
                          <div className="mt-2 flex justify-end">
                            <LinkIcon href={`/parlays/${parlay.id}`} label="View Receipt" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Render Legs */}
                    <div className="flex flex-col gap-3 opacity-70">
                      {parlay.parlay_legs?.map((leg: any) => (
                         <div key={leg.id} className="flex items-center justify-between bg-background/30 p-2 rounded-lg border border-border/30">
                           <div>
                             <p className="text-xs font-semibold">{leg.events?.away_team} @ {leg.events?.home_team}</p>
                           </div>
                           <div className="text-right flex items-center gap-3">
                             <div>
                               <p className="text-xs font-bold">{leg.selection}</p>
                             </div>
                             <Badge variant="outline" className={`text-[8px] uppercase tracking-tighter ${leg.status === 'won' ? 'text-primary border-primary/50' : leg.status === 'lost' ? 'text-destructive border-destructive/50' : ''}`}>
                               {leg.status}
                             </Badge>
                           </div>
                         </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {settledPicks.map(pick => (
                <Card key={pick.id} className={`bg-card/40 border-border/50 opacity-80 ${pick.status === 'won' ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={pick.status === 'won' ? 'default' : 'destructive'} className="text-[10px] uppercase font-bold tracking-tighter">
                            {pick.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(pick.events.start_time).toLocaleString()}</span>
                        </div>
                        <h3 className="font-bold text-muted-foreground">
                          {pick.events.away_team} @ {pick.events.home_team}
                        </h3>
                        <div className="text-sm font-semibold">Selected: {pick.event_markets.selection} ({Number(pick.event_markets.odds).toFixed(2)})</div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="text-right">
                          <p className={`text-xl font-black ${pick.status === 'won' ? 'text-primary' : 'text-muted-foreground'}`}>
                            {pick.status === 'won' ? '+' : pick.status === 'lost' ? '-' : ''}
                            {pick.status === 'won' ? (pick.stake * Number(pick.event_markets.odds) - pick.stake).toFixed(2) : pick.stake} U
                          </p>
                          <div className="mt-2 flex justify-end">
                            <LinkIcon href={`/picks/${pick.id}`} label="View Receipt" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {pick.edge !== undefined && (
                      <div className="mt-2 flex gap-2">
                        {pick.model_probability && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Model: {pick.model_probability}%</span>
                        )}
                        {pick.edge && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Edge: {pick.edge > 0 ? '+' : ''}{pick.edge}%</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
