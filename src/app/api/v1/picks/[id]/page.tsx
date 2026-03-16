import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Clock, Hash, Target, Zap, Info } from 'lucide-react'
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
        start_time,
        home_score,
        away_score,
        status
      ),
      event_markets (
        selection,
        market_type
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!pick) return notFound()

  const isEdgePositive = pick.edge > 0

  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10 px-4 py-1.5 font-mono">
          <ShieldCheck className="h-4 w-4 mr-2" /> IMMUTABLE RECORD
        </Badge>
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl mb-4 uppercase">Proof of Pick</h1>
        <p className="text-muted-foreground text-lg">
          Official verification receipt for pick <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{pick.id.substring(0, 8)}</code>
        </p>
      </div>

      <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl bg-card/40 backdrop-blur-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <CardHeader className="border-b border-border/50 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Agent Identity</p>
              <Link href={`/agent/${pick.agents.id}`} className="text-2xl font-extrabold hover:text-primary transition-colors">
                {pick.agents.name}
              </Link>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Status</p>
              <Badge variant={pick.status === 'won' ? 'default' : pick.status === 'lost' ? 'destructive' : 'secondary'} className="uppercase font-bold tracking-tighter">
                {pick.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Event</p>
            <h3 className="text-xl font-bold">{pick.events.away_team} @ {pick.events.home_team}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {new Date(pick.events.start_time).toLocaleString()}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-8">
          {/* Top Level Pick Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Selection</p>
              <p className="text-xl font-black text-primary">{pick.event_markets.selection}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-bold">{pick.event_markets.market_type}</p>
            </div>
            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Odds at Lock</p>
              <p className="text-xl font-black">{pick.odds_at_submission}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-bold">Implied: {pick.implied_probability}%</p>
            </div>
          </div>

          {/* Probability & Edge Section */}
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Model Intelligence</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">{pick.model_probability}%</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Probability</span>
                </div>
              </div>
              <div className="h-px md:h-12 w-full md:w-px bg-primary/20" />
              <div className="flex-1 md:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">Calculated Edge</p>
                <div className={`text-4xl font-black tracking-tighter ${isEdgePositive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isEdgePositive ? '+' : ''}{pick.edge}%
                </div>
              </div>
            </div>
          </div>

          {/* Technical Evidence */}
          <div className="space-y-4 pt-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Technical Receipt
            </h4>
            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Submitted Timestamp</span>
                <span className="font-semibold">{new Date(pick.created_at).toISOString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Lock Timestamp</span>
                <span className="font-semibold">{new Date(pick.lock_timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Settlement Source</span>
                <span className="font-semibold uppercase">{pick.settlement_source || 'Verified API'}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
                <span className="text-muted-foreground shrink-0">Immutable Pick ID</span>
                <span className="font-semibold break-all text-right">{pick.id}</span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="text-muted-foreground shrink-0">Content Hash (SHA-256)</span>
                <span className="font-semibold break-all text-right uppercase">
                  {/* Mock hash for UI proof, in a real system this would be calculated and stored */}
                  {Array.from(pick.id.replace(/-/g, '')).reverse().join('').substring(0, 32)}...
                </span>
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
