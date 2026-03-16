import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Flame, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventGrid } from './event-grid'

export const dynamic = 'force-dynamic'

// Stake-style Sport Icons
const SportIcons: Record<string, React.FC<{className?: string}>> = {
  basketball: ({ className }) => (<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className={cn("inline-block shrink-0", className)}><path fill="currentColor" fillRule="evenodd" d="M20.864 18.483a11 11 0 0 0 1.824-3.931 8.5 8.5 0 0 0-3.529 1.402 36 36 0 0 1 1.705 2.529m-5.399 3.94a11.1 11.1 0 0 0 4.134-2.493 33 33 0 0 0-1.833-2.776 8.48 8.48 0 0 0-2.292 5.269zm1.998-17.63a11.43 11.43 0 0 1-2.218 6.772c.98.934 1.907 1.915 2.768 2.96a10.35 10.35 0 0 1 4.95-1.842c.019-.23.037-.45.037-.688 0-4.196-2.356-7.843-5.812-9.694.175.806.275 1.64.275 2.492m-13.365-.43a35.2 35.2 0 0 1 9.79 5.965 9.6 9.6 0 0 0 1.742-5.535c0-1.182-.22-2.318-.614-3.362A11 11 0 0 0 12 1a10.94 10.94 0 0 0-7.902 3.363M5.932 16.33c-1.55 0-3.016-.312-4.364-.862C3.026 19.838 7.142 23 12 23c.55 0 1.082-.055 1.613-.128a10.35 10.35 0 0 1 3.007-7.166 33 33 0 0 0-2.548-2.73 11.48 11.48 0 0 1-8.131 3.363z" clipRule="evenodd"></path><path fill="currentColor" fillRule="evenodd" d="M12.706 11.73a33.4 33.4 0 0 0-9.818-5.883 10.9 10.9 0 0 0-1.824 7.321 9.66 9.66 0 0 0 11.642-1.448z" clipRule="evenodd"></path></svg>),
  football: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M20 7c-1.39-2.09-4.81-4.04-8-4.04-3.19 0-6.61 1.95-8 4.04-1.72 2.59-1.9 6.22-1.9 8 0 .8.09 1.58.26 2.34C3.89 20.25 7 21 12 21s8.11-.75 9.64-3.66C21.81 16.58 21.9 15.8 21.9 15c0-1.78-.18-5.41-1.9-8ZM12 5.5c2.31 0 4.88 1.45 6.13 3.12 1.34 1.79 1.4 4.54 1.4 6.38 0 .5-.05 1.01-.15 1.5H4.62c-.1-.49-.15-1-.15-1.5 0-1.84.06-4.59 1.4-6.38C7.12 6.95 9.69 5.5 12 5.5Zm-1 12.5v-2h2v2h-2Zm0-4v-5h2v5h-2Z" /></svg>),
  soccer: ({ className }) => (<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className={cn("inline-block shrink-0", className)}><path fill="currentColor" d="M22.999 13.368a2.61 2.61 0 0 0-2.19.007l.015-.007a3.45 3.45 0 0 0-1.442-3.766l-.013-.008c1.584-.148 2.414-2.896 2.414-2.896a11.33 11.33 0 0 0-4.43-4.531l-.056-.03s-2.672-.369-3.474.482C12.828 1 10.001 1 10.001 1a11 11 0 0 0-5.704 2.999l.001-.002a2.84 2.84 0 0 0 1.063 2.216l.006.005c-1.41.333-2.875 2.322-2.635 3.127a1.54 1.54 0 0 0-1.273-.62h.002c-.29.95-.459 2.041-.461 3.172v.002c0 1.22.199 2.394.566 3.49l-.022-.077a3.64 3.64 0 0 0 1.134-1.593l.008-.025a4.5 4.5 0 0 0 2.477.737 4.5 4.5 0 0 0 1.305-.19l-.033.008a4.6 4.6 0 0 0-.46 2.015c0 .921.268 1.779.73 2.499l-.011-.018c-.9.13-1.681.562-2.255 1.19l-.002.003A11 11 0 0 0 12.055 23a10.8 10.8 0 0 0 2.719-.35l-.075.017a4.94 4.94 0 0 0-2.612-2.615l-.032-.012c1.29-.074 2.56-1.97 2.763-3.266.927.424 2.01.67 3.15.67q.42 0 .827-.044l-.034.003a4.4 4.4 0 0 0-.312 1.646c0 .593.115 1.159.323 1.677l-.01-.03a11.12 11.12 0 0 0 4.231-7.268L23 13.37zm-8.448 2.008c-1.41-1.998-5.445-3.191-7.564-2.007 1.216-2.997.793-4.95-.718-7.022 2.764.26 6.043-1.184 7.37-3.034.378 2.007 2.579 5.357 4.606 6.032-3.298 1.507-3.676 3.885-3.694 6.031"></path></svg>),
  hockey: ({ className }) => (<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className={cn("inline-block shrink-0", className)}><path fill="currentColor" d="M23.006 1c-.02.045-7.147 15.765-9.39 20.909l-.006.011A1.83 1.83 0 0 1 11.938 23h-6.31l1.504-4.473h3.092a1.84 1.84 0 0 0 1.621-1.027L20.255 1zM3.747 23H1.913a.917.917 0 0 1-.853-1.228l.853-2.118.005-.013a1.835 1.835 0 0 1 1.692-1.133h1.632z"></path><path fill="currentColor" d="M2.83 11.635a9.9 9.9 0 0 0 3.965.825l.162-.002h.064c.844 0 1.668-.09 2.385-.247l.045-.008a6.8 6.8 0 0 0 1.633-.56v1.64c0 .55-.743 1.055-2.063 1.339-1.972.421-4.494.174-5.64-.569l-.006-.001a.96.96 0 0 1-.545-.767zm4.127-4.108c2.27 0 4.11.694 4.11 1.55-.001.854-1.84 1.548-4.11 1.548-2.269 0-4.108-.694-4.108-1.549s1.84-1.55 4.108-1.55"></path></svg>),
  baseball: ({ className }) => (<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className={cn("inline-block shrink-0", className)}><path fill="currentColor" d="M1.119 11.853c.719.26 1.415.57 1.994.881l-.449.998-.033.084a.917.917 0 0 0 .49 1.127l-.005-.001a.9.9 0 0 0 .383.084.92.92 0 0 0 .834-.541l.376-.834.075.045a19 19 0 0 1 2.392 1.834l-1.33 1.32a.916.916 0 0 0 .647 1.568h.011c.238 0 .455-.09.617-.239l1.348-1.283.447.501c.45.524.877 1.082 1.295 1.7l-.917.393-.005.002a.918.918 0 0 0 .364 1.758l.027-.001a.9.9 0 0 0 .375-.082l1.082-.532-.041-.084c.4.746.74 1.527 1.05 2.449h-.148c-6.072-.006-10.994-4.928-10.994-11v-.184z"></path><path fill="currentColor" d="M10.048 1.298c.282.922.643 1.81 1.034 2.562l-1.165.531-.005.003a.917.917 0 0 0 .385 1.748h.024c.136 0 .265-.03.375-.082L12 5.473l.051.086a22 22 0 0 0 2.186 2.848l-.587.595a.913.913 0 0 0 .646 1.56h.005a.92.92 0 0 0 .642-.267l.596-.597c.833.76 1.727 1.455 2.752 2.127l-.56 1.256.003-.005a.916.916 0 0 0 .456 1.216l-.006-.002a.9.9 0 0 0 .382.085.92.92 0 0 0 .833-.542l.485-1.042c.884.46 1.815.85 2.899 1.19l-.01.068c-.837 4.43-4.331 7.922-8.831 8.768l-.031-.12a16 16 0 0 0-1.161-2.813l1.082-.486.006-.001a.918.918 0 0 0-.15-1.822.9.9 0 0 0-.57.2l-1.247.56-.047-.078a19.6 19.6 0 0 0-2.081-2.673l.586-.596v.001a.917.917 0 0 0-1.291-1.293l-.597.586A22 22 0 0 0 5.468 12l.587-1.33-.002.007a.917.917 0 0 0-1.668-.757l-.53 1.16a16 16 0 0 0-2.678-1.06l.01-.068c.837-4.43 4.33-7.922 8.83-8.768z"></path><path fill="currentColor" d="m19.884 12.79-.001.002q-.048-.023-.095-.048zM12 1.002c6.077 0 11.004 4.924 11.004 11v.146l-.111-.034a15 15 0 0 1-2.218-.975l.492-1.075a.95.95 0 0 0-.86-1.348.95.95 0 0 0-.862.554l-.394.915-.063-.04a18 18 0 0 1-2.137-1.7l1.356-1.33a.92.92 0 0 0-.65-1.571.92.92 0 0 0-.653.27l-1.32 1.327a19.5 19.5 0 0 1-1.907-2.438l.834-.376.007-.001a.918.918 0 0 0-.332-1.772.9.9 0 0 0-.427.106l-1 .448.044.09A16 16 0 0 1 11.843 1zM3.946 11.126l-.092-.043.001-.002z"></path></svg>),
  tennis: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.91.15-1.78.43-2.61C5.7 10.61 7.23 11 9 11c3.87 0 7-3.13 7-7 0-1.77-.39-3.3-1.01-4.57 3.44.75 6.01 3.79 6.01 7.57 0 4.41-3.59 8-8 8z" /></svg>),
  other: ({ className }) => (<svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>)
}

const getSportIcon = (sportCategory: string, className?: string) => {
  const Icon = SportIcons[sportCategory] || SportIcons.other
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

    const sportId = (event.leagues as any)?.sport_id?.toLowerCase() || 'other'
    let sportCategory = 'other'
    let sportLabel = 'Sports'
    
    const id = sportId.toLowerCase()
    if (id.includes('soccer') || id === 'epl') { sportCategory = 'soccer'; sportLabel = 'Soccer' }
    else if (id.includes('basketball') || id === 'nba') { sportCategory = 'basketball'; sportLabel = 'Basketball' }
    else if (id.includes('hockey') || id.includes('nhl')) { sportCategory = 'hockey'; sportLabel = 'hockey' }
    else if (id.includes('baseball') || id.includes('mlb')) { sportCategory = 'baseball'; sportLabel = 'Baseball' }
    else if (id.includes('tennis')) { sportCategory = 'tennis'; sportLabel = 'Tennis' }
    else if (id.includes('football') || id === 'nfl') { sportCategory = 'football'; sportLabel = 'Football' }

    return {
      id: event.id,
      sportId,
      sportCategory,
      sportLabel,
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
  const sportCategories = Array.from(new Set(mappedEvents.map(e => e.sportCategory)))
  const sportTabs = sportCategories.map(cat => ({
    id: cat,
    label: mappedEvents.find(e => e.sportCategory === cat)?.sportLabel || cat
  }))

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
        <div className="w-full overflow-x-auto hide-scrollbar mb-6 pb-2">
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
            {sportTabs.map(sport => (
              <TabsTrigger 
                key={sport.id} 
                value={sport.id}
                className="data-[state=active]:bg-[#1a384c] data-[state=active]:text-white bg-[#0f212e] text-slate-400 hover:text-slate-200 border-none rounded-md px-6 py-3 font-semibold tracking-wide transition-all data-[state=active]:shadow-none hover:bg-[#1a384c]/50 flex items-center gap-2"
              >
                {getSportIcon(sport.id, "w-5 h-5")}
                {sport.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <EventGrid events={mappedEvents} />
        </TabsContent>
        {sportTabs.map(sport => (
          <TabsContent key={sport.id} value={sport.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <EventGrid events={mappedEvents.filter(e => e.sportCategory === sport.id)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
