'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ShieldAlert, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  home_team: string
  away_team: string
  status: string
  home_score: number | null
  away_score: number | null
  leagues: { name: string }
}

export function AdminClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [settling, setSettling] = useState<string | null>(null)
  const router = useRouter()

  const handleSettle = async (eventId: string, homeScore: number, awayScore: number) => {
    setSettling(eventId)
    try {
      const response = await fetch('/api/v1/admin/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, home_score: homeScore, away_score: awayScore })
      })

      if (response.ok) {
        // Remove settled event from the list locally
        setEvents(events.filter(e => e.id !== eventId))
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to settle event')
    } finally {
      setSettling(null)
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-card/40 border-border/50 border-t-destructive/50 shadow-lg backdrop-blur">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Needs Settlement
          </h2>
          <p className="text-muted-foreground mt-1">Found {events.length} events waiting for results.</p>
        </div>
        <CardContent className="space-y-6 pt-6">
          {events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl">
               No events currently need settlement.
            </div>
          ) : (
            events.map(event => (
              <EventRow 
                key={event.id} 
                event={event} 
                onSettle={handleSettle} 
                isSettling={settling === event.id} 
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EventRow({ event, onSettle, isSettling }: { event: Event, onSettle: any, isSettling: boolean }) {
  const [homeScore, setHomeScore] = useState(event.home_score || 0)
  const [awayScore, setAwayScore] = useState(event.away_score || 0)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-6 border border-border/40 rounded-xl bg-background/40 hover:bg-background/60 transition-colors gap-6 shadow-sm">
      <div className="flex-1 flex flex-col md:flex-row items-center gap-6 w-full">
         <div className="flex flex-col items-center flex-1 w-full bg-card/50 p-4 rounded-lg border border-border/30">
           <span className="font-bold text-lg mb-3">{event.away_team}</span>
           <Input 
             type="number" 
             value={awayScore} 
             onChange={(e) => setAwayScore(parseInt(e.target.value))}
             className="w-24 h-10 text-center text-lg font-black bg-background" 
           />
           <span className="text-[10px] text-muted-foreground mt-2 font-bold tracking-widest uppercase">AWAY</span>
         </div>
         <div className="text-muted-foreground font-black text-xl shrink-0 opacity-30">VS</div>
         <div className="flex flex-col items-center flex-1 w-full bg-card/50 p-4 rounded-lg border border-border/30">
           <span className="font-bold text-lg mb-3">{event.home_team}</span>
           <Input 
             type="number" 
             value={homeScore} 
             onChange={(e) => setHomeScore(parseInt(e.target.value))}
             className="w-24 h-10 text-center text-lg font-black bg-background" 
           />
           <span className="text-[10px] text-muted-foreground mt-2 font-bold tracking-widest uppercase">HOME</span>
         </div>
      </div>
      <div className="flex flex-col md:items-end items-center shrink-0 w-full md:w-auto">
         <Badge variant="outline" className="mb-4 px-3 py-1 text-[10px] tracking-tighter font-bold bg-[#1a384c] text-white border-none uppercase">
           {event.leagues?.name || 'SPORT'}
         </Badge>
         <Button 
           onClick={() => onSettle(event.id, homeScore, awayScore)}
           disabled={isSettling}
           size="lg" 
           className="w-full md:w-auto font-bold tracking-wide"
         >
           {isSettling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />} 
           Settle Market
         </Button>
      </div>
    </div>
  )
}
