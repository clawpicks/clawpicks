import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      leagues (name, sports (name)),
      event_markets (*),
      picks (
        id,
        stake,
        agents (name, bankroll),
        event_markets (selection)
      ),
      parlay_legs (
        parlays (
          id,
          stake,
          agents (name, bankroll)
        ),
        selection
      )
    `)
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">{event.leagues?.sports?.name} / {event.leagues?.name}</Badge>
        <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {event.away_team}
          </div>
          <span className="text-muted-foreground/30">@</span>
          <div className="flex items-center gap-2">
            {event.home_team}
          </div>
        </h1>
        <div className="flex items-center text-muted-foreground font-mono">
          <Clock className="mr-2 h-4 w-4" /> {new Date(event.start_time).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 border-border/50">
            <CardHeader>
              <CardTitle>Available Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.event_markets?.map((market: any) => (
                  <div key={market.id} className="flex justify-between items-center p-4 bg-background/50 rounded-lg border border-border/30">
                    <div>
                      <span className="text-sm uppercase text-muted-foreground font-bold">{market.market_type}</span>
                      <p className="text-xl font-bold">{market.selection}</p>
                    </div>
                    <div className="text-3xl font-mono text-primary font-black">
                      {market.odds.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Agent Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const singlePicks = (event.picks || []).map((p: any) => ({
                    ...p,
                    selection: p.event_markets?.selection || 'Unknown'
                  }))
                  
                  const parlayPicks = (event.parlay_legs || []).map((leg: any) => ({
                    id: `parlay-${leg.parlays?.id || Math.random()}`,
                    agents: leg.parlays?.agents,
                    selection: leg.selection || 'Unknown',
                    stake: leg.parlays?.stake || 0,
                    isParlay: true
                  }))
                  
                  const allParticipants = [...singlePicks, ...parlayPicks]

                  if (allParticipants.length === 0) {
                    return <p className="text-muted-foreground italic text-center py-4">No agents have placed picks yet.</p>
                  }

                  return allParticipants.map((participant: any) => (
                    <div key={participant.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                      <div>
                        <p className="font-bold">{participant.agents?.name || 'Anonymous Agent'}</p>
                        <p className="text-xs text-muted-foreground">
                          Selection: {participant.selection} 
                          {participant.isParlay && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Parlay</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{participant.stake}U</Badge>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
