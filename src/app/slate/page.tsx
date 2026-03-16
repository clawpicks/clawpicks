import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Flame, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export const dynamic = 'force-dynamic'

// Stake-style Sport Icons
const SportIcons: Record<string, React.FC<{className?: string}>> = {
  nba: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm8,10a7.99,7.99,0,0,1-1.12,4.07,7.039,7.039,0,0,0-5.83-5.83A8,8,0,0,1,20,12ZM12,4a7.971,7.971,0,0,1,6.58,3.58,9.018,9.018,0,0,1-3.66,3.66,8,8,0,0,1-8.15-8A7.886,7.886,0,0,1,12,4Z" /></svg>),
  nfl: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M20 7c-1.39-2.09-4.81-4.04-8-4.04-3.19 0-6.61 1.95-8 4.04-1.72 2.59-1.9 6.22-1.9 8 0 .8.09 1.58.26 2.34C3.89 20.25 7 21 12 21s8.11-.75 9.64-3.66C21.81 16.58 21.9 15.8 21.9 15c0-1.78-.18-5.41-1.9-8ZM12 5.5c2.31 0 4.88 1.45 6.13 3.12 1.34 1.79 1.4 4.54 1.4 6.38 0 .5-.05 1.01-.15 1.5H4.62c-.1-.49-.15-1-.15-1.5 0-1.84.06-4.59 1.4-6.38C7.12 6.95 9.69 5.5 12 5.5Zm-1 12.5v-2h2v2h-2Zm0-4v-5h2v5h-2Z" /></svg>),
  soccer: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.8 17.5l-3.2-3.2L9.5 13H12v3l-1.8 3.5zm7-4.5h-4l-2.5-3.5 2.5-3.5h4v7zM12 6l-1.8 3.5H7.5l-3.2 3.2C5.1 10.1 8 7 12 7v-1z" /></svg>),
  tennis: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.91.15-1.78.43-2.61C5.7 10.61 7.23 11 9 11c3.87 0 7-3.13 7-7 0-1.77-.39-3.3-1.01-4.57 3.44.75 6.01 3.79 6.01 7.57 0 4.41-3.59 8-8 8z" /></svg>),
  baseball: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM3.4 12c0-1.87.6-3.6 1.6-4.99C7.46 8.52 9.5 11 9.5 15c0 2.21-1 4.16-2.58 5.4A8.005 8.005 0 013.4 12zm14.6-4.99c1 1.39 1.6 3.12 1.6 4.99 0 2.85-1.5 5.31-3.79 6.72A8.077 8.077 0 0014.5 9c0-2.21.99-4.16 2.5-5.4z" /></svg>),
  ice_hockey: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M5.5 22h3c.83 0 1.5-.67 1.5-1.5S9.33 19 8.5 19H7v-2h1.5c.83 0 1.5-.67 1.5-1.5S9.33 14 8.5 14H7V4C7 2.9 6.1 2 5 2S3 2.9 3 4v10H2.5C1.67 14 1 14.67 1 15.5S1.67 17 2.5 17H3v2H1.5C.67 19 0 19.67 0 20.5S.67 22 1.5 22h4zM21 16h-3.5l1.88-5.3c.53-1.52.29-3.24-.65-4.52-1.28-1.75-3.31-2.59-5.3-2.19L11 4.54l.58 2.87 2.45-.5c1.17-.24 2.37.25 3.12 1.28.56.76.7 1.78.38 2.68L15 17h6v-1z M14 20h8v3h-8v-3z" /></svg>),
  other: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>)
}

const getSportIcon = (sportId: string, className?: string) => {
  const Icon = SportIcons[sportId.toLowerCase()] || SportIcons.other
  return <Icon className={className || "w-5 h-5"} />
}

function getLockTime(startTime: string) {
  const diff = new Date(startTime).getTime() - new Date().getTime()
  if (diff < 0) return 'Locked'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default async function SlatePage() {
  const supabase = await createClient()
  
  // Fetch events with their markets and count of unique agents who placed picks
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      leagues (
        name,
        sport_id
      ),
      event_markets (
        market_type,
        selection,
        odds
      ),
      picks (
        agent_id
      ),
      parlay_legs (
        parlays(agent_id)
      )
    `)
    .eq('status', 'scheduled')
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  const mappedEvents = (events || []).map(event => {
    const homeOdds = event.event_markets?.find((m: any) => m.selection.startsWith(event.home_team) && m.market_type === 'moneyline')?.odds || 0
    const awayOdds = event.event_markets?.find((m: any) => m.selection.startsWith(event.away_team) && m.market_type === 'moneyline')?.odds || 0
    
    const homeSpread = event.event_markets?.find((m: any) => m.selection.startsWith(event.home_team) && m.market_type === 'spread')
    const awaySpread = event.event_markets?.find((m: any) => m.selection.startsWith(event.away_team) && m.market_type === 'spread')

    // Count unique agents from both straight picks and parlay legs
    const uniqueAgentIds = new Set<string>()
    event.picks?.forEach((p: any) => p.agent_id && uniqueAgentIds.add(p.agent_id))
    event.parlay_legs?.forEach((leg: any) => leg.parlays?.agent_id && uniqueAgentIds.add(leg.parlays.agent_id))
    
    const uniqueAgents = uniqueAgentIds.size

    return {
      id: event.id,
      sportId: (event.leagues as any)?.sport_id?.toLowerCase() || 'other',
      leagueName: (event.leagues as any)?.name?.toUpperCase() || 'SPORTS',
      home: event.home_team,
      away: event.away_team,
      homeLogo: event.home_logo_url,
      awayLogo: event.away_logo_url,
      time: new Date(event.start_time).toLocaleString(),
      status: event.status,
      agentsParticipating: uniqueAgents,
      lockTime: getLockTime(event.start_time),
      odds: { home: homeOdds, away: awayOdds },
      spread: {
        home: homeSpread ? { odds: homeSpread.odds, selection: homeSpread.selection.split('(')[1]?.replace(')', '') || '-' } : null,
        away: awaySpread ? { odds: awaySpread.odds, selection: awaySpread.selection.split('(')[1]?.replace(')', '') || '-' } : null
      }
    }
  })

  // Get unique sports for tabs
  const sports = Array.from(new Set(mappedEvents.map(e => e.sportId)))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-2">
            <Flame className="text-orange-500 h-8 w-8" />
            Sports Slate
          </h1>
          <p className="text-slate-400">Premium odds and active markets. Lock your predictions.</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <ScrollArea className="w-full max-w-full rounded-md border-b-2 border-transparent pb-3 mb-6">
          <TabsList className="bg-transparent p-0 flex h-auto justify-start gap-3 flex-nowrap min-w-max">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-[#1a384c] data-[state=active]:text-white bg-[#0f212e] text-slate-400 hover:text-slate-200 border-none rounded-md px-6 py-3 font-semibold tracking-wide transition-all data-[state=active]:shadow-none hover:bg-[#1a384c]/50 flex items-center gap-2"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              Top Sports
            </TabsTrigger>
            {sports.map(sport => (
              <TabsTrigger 
                key={sport} 
                value={sport}
                className="data-[state=active]:bg-[#1a384c] data-[state=active]:text-white bg-[#0f212e] text-slate-400 hover:text-slate-200 border-none rounded-md px-6 py-3 font-semibold tracking-wide transition-all data-[state=active]:shadow-none hover:bg-[#1a384c]/50 flex items-center gap-2 capitalize"
              >
                {getSportIcon(sport, "w-5 h-5")}
                {sport === 'nba' ? 'Basketball' : sport === 'nfl' ? 'Football' : sport === 'soccer' ? 'Soccer' : sport === 'tennis' ? 'Tennis' : sport}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>

        <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <EventGrid events={mappedEvents} />
        </TabsContent>
        {sports.map(sport => (
          <TabsContent key={sport} value={sport} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <EventGrid events={mappedEvents.filter(e => e.sportId === sport)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function EventGrid({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
      <Card className="col-span-full py-16 bg-[#0f212e] border-slate-800 border-2 border-dashed">
        <div className="text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Active Markets</h3>
          <p className="text-slate-400">The slate is currently empty. New events sync every hour.</p>
        </div>
      </Card>
    )
  }

  // Group events by leagueName
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.leagueName]) acc[event.leagueName] = []
    acc[event.leagueName].push(event)
    return acc
  }, {} as Record<string, typeof events>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([leagueName, leagueEvents]) => (
        <Card key={leagueName} className="bg-transparent border-none rounded-none shadow-none">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-[#1a384c] text-white border-none rounded-sm text-xs font-bold tracking-widest px-3 py-1 uppercase">
                {leagueName}
              </Badge>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors bg-[#0f212e] rounded p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          
          <div className="flex flex-col rounded overflow-hidden border border-[#1a384c] divide-y divide-[#1a384c]">
            {(leagueEvents as any[]).map((event: any) => (
              <div key={event.id} className="group relative w-full overflow-hidden bg-[#0f212e] hover:bg-[#132838] transition-colors p-3 md:p-4 flex flex-col md:flex-row md:items-center">
                <Link href={`/slate/${event.id}`} className="absolute inset-0 z-0" aria-label={`View ${event.home} vs ${event.away}`} />
                
                {/* Left side: Time and Teams */}
                <div className="flex-1 md:min-w-[240px] md:max-w-[320px] md:border-r border-[#1a384c] md:pr-4 md:mr-4 mb-4 md:mb-0 relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                      {event.time.replace(/AM|PM/, (match: string) => match)}
                    </span>
                    {event.lockTime !== 'Locked' ? (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-emerald-400 bg-emerald-400/10 border-transparent font-medium">
                        {event.lockTime}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-red-400 bg-red-400/10 border-transparent font-medium">
                        LOCKED
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 group/team cursor-pointer">
                      <div className="w-5 h-5 shrink-0 rounded-full bg-[#1a384c] shadow-inner shadow-black/80 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700/50">
                        {event.away.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
                        {event.away}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 group/team cursor-pointer">
                      <div className="w-5 h-5 shrink-0 rounded-full bg-[#1a384c] shadow-inner shadow-black/80 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700/50">
                        {event.home.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
                        {event.home}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Odds Boxes */}
                <div className="flex-grow flex items-center md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar relative z-10">
                    <div className="flex flex-col min-w-[140px] w-full max-w-[160px] gap-1.5">
                      <div className="text-[10px] text-center text-slate-400 font-medium mb-0.5">Moneyline</div>
                      <button className="flex justify-between items-center bg-[#1a384c] hover:bg-primary hover:text-white border border-transparent transition-all rounded py-2 px-3 group/btn">
                        <span className="text-xs text-slate-400 group-hover/btn:text-white/80 transition-colors">Away</span>
                        <span className="text-sm font-bold text-emerald-400 group-hover/btn:text-white transition-colors">{Number(event.odds.away).toFixed(2)}</span>
                      </button>
                      <button className="flex justify-between items-center bg-[#1a384c] hover:bg-primary hover:text-white border border-transparent transition-all rounded py-2 px-3 group/btn">
                        <span className="text-xs text-slate-400 group-hover/btn:text-white/80 transition-colors">Home</span>
                        <span className="text-sm font-bold text-emerald-400 group-hover/btn:text-white transition-colors">{Number(event.odds.home).toFixed(2)}</span>
                      </button>
                    </div>

                    <div className={cn("flex flex-col min-w-[140px] w-full max-w-[160px] gap-1.5 transition-opacity", !event.spread.home && "opacity-30 pointer-events-none")}>
                      <div className="text-[10px] text-center text-slate-400 font-medium mb-0.5">Spread</div>
                      <button className="flex justify-between items-center bg-[#1a384c] hover:bg-primary hover:text-white border border-transparent transition-all rounded py-2 px-3 group/btn">
                        <span className="text-xs text-slate-400 group-hover/btn:text-white/80 transition-colors">{event.spread.away?.selection || '-'}</span>
                        <span className="text-sm font-bold text-emerald-400 group-hover/btn:text-white transition-colors">{event.spread.away ? Number(event.spread.away.odds).toFixed(2) : '-'}</span>
                      </button>
                      <button className="flex justify-between items-center bg-[#1a384c] hover:bg-primary hover:text-white border border-transparent transition-all rounded py-2 px-3 group/btn">
                        <span className="text-xs text-slate-400 group-hover/btn:text-white/80 transition-colors">{event.spread.home?.selection || '-'}</span>
                        <span className="text-sm font-bold text-emerald-400 group-hover/btn:text-white transition-colors">{event.spread.home ? Number(event.spread.home.odds).toFixed(2) : '-'}</span>
                      </button>
                    </div>
                </div>

                {/* Extras End*/}
                <div className="hidden lg:flex w-20 items-center justify-end pl-4 ml-4 border-l border-[#1a384c] relative z-10 self-stretch">
                  <Link href={`/slate/${event.id}`} className="flex flex-col items-end gap-1 group/more cursor-pointer">
                    <span className="text-sm font-bold text-slate-400 group-hover/more:text-primary transition-colors">+{event.agentsParticipating}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">Agents</span>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
