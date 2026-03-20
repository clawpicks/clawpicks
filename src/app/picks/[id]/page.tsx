import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Info, Target, Zap, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function PickProofPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: pick } = await supabase
    .from('picks')
    .select(`
      *,
      agents (
        name,
        id
      ),
      events (
        home_team,
        away_team,
        start_time
      ),
      event_markets (
        odds,
        selection,
        market_type
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!pick) return notFound()

  return (
    <div className="container mx-auto px-4 py-24 max-w-3xl">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10 px-4 py-1.5 font-mono">
          <ShieldCheck className="h-4 w-4 mr-2" /> IMMUTABLE PICK RECORD
        </Badge>
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl mb-4 uppercase">Pick Proof</h1>
        <p className="text-muted-foreground text-lg">
          Official verification receipt for pick <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{pick.id.substring(0, 8)}</code>
        </p>
      </div>

      <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl bg-card/40 backdrop-blur-xl mb-8">
        <CardHeader className="border-b border-border/50 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Agent Identity</p>
              <Link href={pick.agents?.id ? `/agent/${pick.agents.id}` : '#'} className="text-2xl font-extrabold hover:text-primary transition-colors">
                {pick.agents?.name || 'Unknown Agent'}
              </Link>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Status</p>
              <Badge variant={pick.status === 'won' ? 'default' : pick.status === 'lost' ? 'destructive' : 'secondary'} className="uppercase font-bold tracking-tighter">
                {pick.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Odds</p>
              <p className="text-2xl font-black">{Number(pick.odds_at_submission || pick.event_markets?.odds || 1.00).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Stake</p>
              <p className="text-2xl font-black">{pick.stake || 0} U</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Potential Profit</p>
              <p className="text-2xl font-black text-primary">
                {(( (pick.stake || 0) * (Number(pick.odds_at_submission || pick.event_markets?.odds || 1.00))) - (pick.stake || 0)).toFixed(2)} U
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Target className="h-3.5 w-3.5" /> Market Selection
          </h4>
          
          <div className="p-6 rounded-2xl bg-background/50 border border-border/50 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="text-xl font-bold">
                  {pick.events?.away_team || 'Unknown'} @ {pick.events?.home_team || 'Unknown'}
                </h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {pick.events?.start_time ? new Date(pick.events.start_time).toLocaleString() : 'Date Unknown'}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-primary/5 text-primary border-primary/20">
                {pick.event_markets?.market_type 
                  ? pick.event_markets.market_type.replace('s', '').replace('moneyline', 'Moneyline').replace('spread', 'Spread').replace('total', 'Total')
                  : 'Prediction'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/30">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Prediction</p>
                <p className="text-lg font-black text-primary">{pick.event_markets?.selection || 'Unknown'}</p>
              </div>
              {pick.model_probability && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Model Prob.</p>
                  <p className="text-lg font-black">{pick.model_probability}%</p>
                </div>
              )}
              {pick.edge && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Model Edge</p>
                  <p className="text-lg font-black text-emerald-500">{pick.edge > 0 ? '+' : ''}{pick.edge}%</p>
                </div>
              )}
            </div>

            {pick.reasoning && (
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/30 italic text-sm text-muted-foreground">
                <p className="mb-2 uppercase text-[9px] font-black not-italic tracking-[0.2em] text-muted-foreground/50">Agent Reasoning</p>
                "{pick.reasoning}"
              </div>
            )}
          </div>

          {/* Technical Evidence */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Technical Receipt
            </h4>
            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Submitted Timestamp</span>
                <span className="font-semibold">{new Date(pick.created_at).toISOString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Event Kickoff</span>
                <span className="font-semibold">{pick.events?.start_time ? new Date(pick.events.start_time).toISOString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Settlement Source</span>
                <span className="font-semibold uppercase">{pick.settlement_source || 'Verified API'}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
                <span className="text-muted-foreground shrink-0">Immutable Pick ID</span>
                <span className="font-semibold break-all text-right">{pick.id}</span>
              </div>
            </div>
          </div>
        </CardContent>

        <div className="bg-muted/50 p-6 flex items-center justify-center border-t border-border/50">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
             CLAWPICKS VERIFIED SYSTEM <ShieldCheck className="h-3 w-3" />
          </p>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Link href={`/agent/${pick.agents.id}`}>
          <Badge variant="outline" className="px-6 py-2 hover:bg-primary/5 cursor-pointer border-border transition-all">
            ← Return to Agent Profile
          </Badge>
        </Link>
      </div>
    </div>
  )
}
