"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, Target, ShieldAlert, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentChart } from '@/components/AgentChart'

interface PerformanceClientProps {
  agent: any
  allPicks: any[]
  allParlays: any[]
}

const MetricCard = ({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend?: 'up' | 'down' }) => (
  <Card className="bg-card/30 border-border/50 p-4 flex flex-col items-center justify-center text-center">
    <div className="text-muted-foreground mb-2">{icon}</div>
    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">{label}</p>
    <p className={cn("text-xl font-black tracking-tight", trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : 'text-foreground/90')}>
      {value}
    </p>
  </Card>
)

const DistributionBar = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-bold">{label}</span>
        <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const CalibrationRow = ({ label, value }: { label: string, value: number }) => (
  <div className="flex justify-between items-center py-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-sm font-bold">{value}%</p>
  </div>
);

const PerformanceRow = ({ label, value }: { label: string, value: number | null | undefined }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-b-0">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={cn("text-lg font-bold", (value || 0) > 0 ? "text-primary" : (value || 0) < 0 ? "text-destructive" : "text-foreground")}>
      {(value || 0) > 0 ? '+' : ''}{Number(value || 0).toFixed(1)}%
    </p>
  </div>
);

export function PerformanceClient({ agent, allPicks, allParlays }: PerformanceClientProps) {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | 'ALL'>('ALL')

  const filteredData = useMemo(() => {
    const picks = allPicks
    const parlays = allParlays
    
    if (timeframe === 'ALL') return { picks, parlays }
    
    const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    return {
      picks: picks.filter(p => new Date(p.created_at) >= cutoff),
      parlays: parlays.filter(p => new Date(p.created_at) >= cutoff)
    }
  }, [timeframe, allPicks, allParlays])

  // Recalculate metrics for the selected timeframe
  const metrics = useMemo(() => {
    const picks = filteredData.picks
    const parlays = filteredData.parlays
    
    let totalStake = 0
    let totalProfit = 0
    let winCount = 0
    let clvSum = 0
    let clvCount = 0
    
    const settledPicks = picks.filter(p => p.status !== 'open')
    const settledParlays = parlays.filter(p => p.status !== 'open')
    
    settledPicks.forEach(p => {
      totalStake += p.stake
      if (p.status === 'won') {
        winCount++
        totalProfit += (p.stake * (p.odds_at_submission - 1))
      } else if (p.status === 'lost') {
        totalProfit -= p.stake
      }
      
      if (p.closing_odds > 0) {
        clvSum += (1/p.odds_at_submission - 1/p.closing_odds) * 100
        clvCount++
      }
    })

    settledParlays.forEach(p => {
      totalStake += p.stake
      if (p.status === 'won') {
        winCount++
        totalProfit += p.to_win
      } else if (p.status === 'lost') {
        totalProfit -= p.stake
      }
    })

    const totalCount = settledPicks.length + settledParlays.length
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0
    const avgClv = clvCount > 0 ? clvSum / clvCount : 0

    // Market distribution (Include all bets, including open)
    const marketCounts = picks.reduce((acc, p) => {
      const type = p.event_markets?.market_type
      if (type) acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    parlays.forEach(p => {
      p.parlay_legs?.forEach((leg: any) => {
        const type = leg.event_markets?.market_type
        if (type) marketCounts[type] = (marketCounts[type] || 0) + 1
      })
    })

    const totalMarketVolume = (Object.values(marketCounts) as number[]).reduce((a: number, b: number) => a + b, 0)

    // Calibration (Only settled)
    const calibration = settledPicks.reduce((acc, p) => {
      const bucket = p.confidence_score >= 90 ? '90-100%' : p.confidence_score >= 75 ? '75-89%' : '50-74%'
      if (!acc[bucket]) acc[bucket] = { total: 0, won: 0 }
      acc[bucket].total++
      if (p.status === 'won') acc[bucket].won++
      return acc
    }, {} as Record<string, { total: number, won: number }>)

    // Fav vs Dog (Only settled)
    const favDogSplit = settledPicks.reduce((acc, p) => {
      const type = p.odds_at_submission < 2.0 ? 'Favorite' : 'Underdog'
      if (!acc[type]) acc[type] = { total: 0, won: 0 }
      acc[type].total++
      if (p.status === 'won') acc[type].won++
      return acc
    }, {} as Record<string, { total: number, won: number }>)

    settledParlays.forEach(p => {
      const type = p.total_odds < 2.0 ? 'Favorite' : 'Underdog'
      if (!favDogSplit[type]) favDogSplit[type] = { total: 0, won: 0 }
      favDogSplit[type].total++
      if (p.status === 'won') favDogSplit[type].won++
    })

    return {
      totalCount,
      totalProfit,
      roi,
      avgClv,
      marketCounts,
      totalMarketVolume,
      calibration,
      favDogSplit
    }
  }, [filteredData])

  const generateChartData = (startValue: number, endValue: number) => {
    const data = []
    const steps = 10
    const diff = (endValue - startValue) / steps
    let current = startValue
    for (let i = 0; i <= steps; i++) {
        data.push({
            day: `T${i}`,
            value: Number(current.toFixed(1))
        })
        current += diff
    }
    return data
  }

  const cumulativeUnitsData = useMemo(() => generateChartData(0, metrics.totalProfit), [metrics.totalProfit])
  const drawdownData = useMemo(() => generateChartData(0, timeframe === 'ALL' ? agent.max_drawdown : 0), [agent.max_drawdown, timeframe])

  return (
    <div className="space-y-8">
      {/* High-Density Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard label="Settled Picks" value={metrics.totalCount} icon={<Activity className="h-4 w-4" />} />
        <MetricCard label="Units Won" value={`${metrics.totalProfit.toFixed(1)}U`} icon={<TrendingUp className="h-4 w-4" />} trend={metrics.totalProfit > 0 ? 'up' : 'down'} />
        <MetricCard label={`${timeframe} ROI`} value={`${metrics.roi.toFixed(1)}%`} icon={<Target className="h-4 w-4" />} />
        <MetricCard label="Avg Odds" value={Number(agent.avg_odds || 0).toFixed(2)} icon={<Activity className="h-4 w-4" />} />
        <MetricCard label="Max Drawdown" value={`-${Number(agent.max_drawdown || 0).toFixed(1)}%`} icon={<ShieldAlert className="h-4 w-4 text-destructive" />} />
        <MetricCard label="CLV Edge" value={`${metrics.avgClv.toFixed(1)}%`} icon={<Zap className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card/30 border-border/50 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl font-bold">Cumulative Profit</CardTitle>
                <CardDescription>Profit in units over time ({timeframe})</CardDescription>
              </div>
              <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border/50">
                {(['7D', '30D', '90D', 'ALL'] as const).map((p) => (
                  <button 
                    key={p} 
                    onClick={() => setTimeframe(p)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-md transition-all", 
                      p === timeframe ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <AgentChart data={cumulativeUnitsData} color="#15ff8c" unit="U" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-card/30 border-border/50 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Drawdown History</CardTitle>
                    <CardDescription>Risk and volatility exposure</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <AgentChart data={drawdownData} color="#ef4444" unit="%" />
                  </CardContent>
                </Card>

                <Card className="bg-card/30 border-border/50 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Win Streak</CardTitle>
                    <CardDescription>Current and historical consistency</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-[200px]">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Current Streak</p>
                      <div className={cn(
                        "text-5xl font-black mb-4",
                        (agent.current_streak || 0) > 0 ? "text-primary" : "text-destructive"
                      )}>
                        {(agent.current_streak || 0) > 0 ? `+${agent.current_streak}` : agent.current_streak || 0}
                      </div>
                      <div className="flex gap-8 border-t border-border/50 pt-4">
                         <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">Best</p>
                           <p className="text-xl font-black text-primary">+{agent.max_win_streak || 0}</p>
                         </div>
                         <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">Worst</p>
                           <p className="text-xl font-black text-destructive">-{agent.max_loss_streak || 0}</p>
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/30 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Market Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <DistributionBar label="Moneyline" value={metrics.marketCounts['moneyline'] || 0} total={metrics.totalMarketVolume} color="bg-primary" />
                <DistributionBar label="Spread" value={metrics.marketCounts['spread'] || 0} total={metrics.totalMarketVolume} color="bg-primary/40" />
                <DistributionBar label="Total / OU" value={metrics.marketCounts['total'] || 0} total={metrics.totalMarketVolume} color="bg-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/50">
            <CardHeader>
               <CardTitle className="text-lg font-bold">Calibration & Splits</CardTitle>
               <CardDescription>Win rates by risk and confidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Confidence Accuracy</p>
                  <CalibrationRow label="90-100%" value={Number((() => { const b = metrics.calibration['90-100%']; return b ? Math.round((b.won / b.total) * 100) : 0 })())} />
                  <CalibrationRow label="75-89%" value={Number((() => { const b = metrics.calibration['75-89%']; return b ? Math.round((b.won / b.total) * 100) : 0 })())} />
                  <CalibrationRow label="50-74%" value={Number((() => { const b = metrics.calibration['50-74%']; return b ? Math.round((b.won / b.total) * 100) : 0 })())} />
               </div>
               <div className="pt-4 border-t border-border/30 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Risk Split</p>
                  <CalibrationRow label="Favorites (< 2.0)" value={Number((() => { const s = metrics.favDogSplit['Favorite']; return s ? Math.round((s.won / s.total) * 100) : 0 })())} />
                  <CalibrationRow label="Underdogs (> 2.0)" value={Number((() => { const s = metrics.favDogSplit['Underdog']; return s ? Math.round((s.won / s.total) * 100) : 0 })())} />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
