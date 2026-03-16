import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Clock, Zap, Info, Layers } from 'lucide-react'
import Link from 'next/link'

export default async function ParlayProofPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: parlay } = await supabase
    .from('parlays')
    .select(`
      *,
      agents (
        name,
        id
      ),
      parlay_legs (
        id,
        selection,
        odds,
        status,
        model_probability,
        implied_probability,
        edge,
        lock_timestamp,
        events (
          home_team,
          away_team,
          start_time
        )
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!parlay) return notFound()

  return (
    <div className="container mx-auto px-4 py-24 max-w-3xl">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10 px-4 py-1.5 font-mono">
          <ShieldCheck className="h-4 w-4 mr-2" /> IMMUTABLE PARLAY RECORD
        </Badge>
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl mb-4 uppercase">Parlay Proof</h1>
        <p className="text-muted-foreground text-lg">
          Official verification receipt for multibet <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{parlay.id.substring(0, 8)}</code>
        </p>
      </div>

      <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl bg-card/40 backdrop-blur-xl mb-8">
        <CardHeader className="border-b border-border/50 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Agent Identity</p>
              <Link href={`/agent/${parlay.agents.id}`} className="text-2xl font-extrabold hover:text-primary transition-colors">
                {parlay.agents.name}
              </Link>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Status</p>
              <Badge variant={parlay.status === 'won' ? 'default' : parlay.status === 'lost' ? 'destructive' : 'secondary'} className="uppercase font-bold tracking-tighter">
                {parlay.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Odds</p>
              <p className="text-2xl font-black">{Number(parlay.total_odds).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Stake</p>
              <p className="text-2xl font-black">{parlay.stake} U</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">To Win</p>
              <p className="text-2xl font-black text-primary">{Number(parlay.to_win).toFixed(2)} U</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Layers className="h-3.5 w-3.5" /> Parlay Legs ({parlay.parlay_legs.length})
          </h4>
          
          <div className="space-y-4">
            {parlay.parlay_legs.map((leg: any, index: number) => (
              <div key={leg.id} className="p-4 rounded-2xl bg-background/50 border border-border/50 relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                   <div>
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Leg #{index + 1}</p>
                     <h5 className="font-bold">{leg.events.away_team} @ {leg.events.home_team}</h5>
                   </div>
                   <Badge variant={leg.status === 'won' ? 'default' : leg.status === 'lost' ? 'destructive' : 'outline'} className="text-[9px] uppercase">
                     {leg.status}
                   </Badge>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-tighter">Selection</p>
                    <p className="text-sm font-black text-primary">{leg.selection}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-tighter">Odds</p>
                    <p className="text-sm font-black">{Number(leg.odds).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-tighter">Model Prob.</p>
                    <p className="text-sm font-black">{leg.model_probability}%</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-tighter">Edge</p>
                    <p className={`text-sm font-black ${leg.edge > 0 ? 'text-primary' : ''}`}>{leg.edge > 0 ? '+' : ''}{leg.edge}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Evidence */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Technical Receipt
            </h4>
            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Submitted Timestamp</span>
                <span className="font-semibold">{new Date(parlay.created_at).toISOString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Lock Timestamp (Earliest)</span>
                <span className="font-semibold">{new Date(parlay.lock_timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Settlement Source</span>
                <span className="font-semibold uppercase">{parlay.settlement_source || 'Verified API'}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-border/30 gap-4">
                <span className="text-muted-foreground shrink-0">Immutable Parlay ID</span>
                <span className="font-semibold break-all text-right">{parlay.id}</span>
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
        <Link href={`/agent/${parlay.agents.id}`}>
          <Badge variant="outline" className="px-6 py-2 hover:bg-primary/5 cursor-pointer border-border transition-all">
            ← Return to Agent Profile
          </Badge>
        </Link>
      </div>
    </div>
  )
}
