'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

function EventRow({ event }: { event: any }) {
  return (
    <div className="group relative w-full overflow-hidden bg-[#0a1620] hover:bg-[#0f212e] transition-colors p-3 md:p-4 flex flex-col md:flex-row md:items-center">
      <Link href={`/slate/${event.id}`} className="absolute inset-0 z-0" aria-label={`View ${event.home} vs ${event.away}`} />
      
      {/* Left side: Time and Teams */}
      <div className="flex-1 md:min-w-[240px] md:max-w-[320px] md:pr-4 md:mr-4 mb-4 md:mb-0 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] text-slate-400 font-bold tracking-tight">
            {event.time}
          </span>
          {event.lockTime !== 'Locked' ? (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-emerald-400 bg-emerald-400/5 border-emerald-400/20 font-bold uppercase tracking-tighter">
              {event.lockTime}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-red-500 bg-red-500/5 border-red-500/20 font-bold uppercase tracking-tighter">
              LOCKED
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 group/team">
            <div className="w-5 h-5 shrink-0 rounded-sm bg-[#1a384c] flex items-center justify-center text-[10px] font-black text-white/50 border border-white/5 uppercase">
              {event.away.substring(0, 2)}
            </div>
            <span className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
              {event.away}
            </span>
          </div>
          <div className="flex items-center gap-2.5 group/team">
            <div className="w-5 h-5 shrink-0 rounded-sm bg-[#1a384c] flex items-center justify-center text-[10px] font-black text-white/50 border border-white/5 uppercase">
              {event.home.substring(0, 2)}
            </div>
            <span className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
              {event.home}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Odds Boxes */}
      <div className="flex-grow flex items-center md:justify-end gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar relative z-10">
          <div className="flex flex-col min-w-[130px] w-full max-w-[150px] gap-1">
            <div className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest mb-1">Moneyline</div>
            <button className="flex justify-between items-center bg-[#1a384c]/50 hover:bg-[#1a384c] border border-white/5 hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter group-hover/btn:text-slate-400">Away</span>
              <span className="text-sm font-black text-emerald-400">{Number(event.odds.away).toFixed(2)}</span>
            </button>
            <button className="flex justify-between items-center bg-[#1a384c]/50 hover:bg-[#1a384c] border border-white/5 hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter group-hover/btn:text-slate-400">Home</span>
              <span className="text-sm font-black text-emerald-400">{Number(event.odds.home).toFixed(2)}</span>
            </button>
          </div>

          <div className={cn("flex flex-col min-w-[130px] w-full max-w-[150px] gap-1 transition-opacity", !event.spread.home && "opacity-20")}>
            <div className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest mb-1">Spread</div>
            <button className="flex justify-between items-center bg-[#1a384c]/50 hover:bg-[#1a384c] border border-white/5 hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{event.spread.away?.selection || '-'}</span>
              <span className="text-sm font-black text-emerald-400">{event.spread.away ? Number(event.spread.away.odds).toFixed(2) : '-'}</span>
            </button>
            <button className="flex justify-between items-center bg-[#1a384c]/50 hover:bg-[#1a384c] border border-white/5 hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{event.spread.home?.selection || '-'}</span>
              <span className="text-sm font-black text-emerald-400">{event.spread.home ? Number(event.spread.home.odds).toFixed(2) : '-'}</span>
            </button>
          </div>
      </div>

      {/* Extras End*/}
      <div className="hidden lg:flex w-24 items-center justify-end pl-6 ml-6 relative z-10 self-stretch">
        <Link href={`/slate/${event.id}`} className="flex flex-col items-end gap-0.5 group/more cursor-pointer">
          <span className="text-sm font-black text-slate-300 group-hover/more:text-primary transition-colors">+{event.agentsParticipating}</span>
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Agents</span>
        </Link>
      </div>
    </div>
  )
}

export function EventGrid({ events }: { events: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [events])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

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

  // Get unique leagues for sub-navigation
  const leagues = Array.from(new Set(events.map(e => e.leagueName))).sort();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col gap-4">
          {/* League Inline Navigation with Carousel Controls */}
          <div className="relative group/carousel border-b border-[#1a384c]">
            {showLeftArrow && (
              <button 
                onClick={() => scroll('left')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-[#0f212e]/90 hover:bg-[#1a384c] text-white p-2 rounded-full shadow-2xl transition-all border border-white/10 backdrop-blur-md hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            
            <div 
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-3 px-8"
            >
              <TabsList className="bg-transparent h-auto p-0 flex gap-2">
                <TabsTrigger 
                  value="all"
                  className="bg-[#1a384c]/30 data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded border border-[#1a384c] text-white/50 data-[state=active]:border-primary transition-all shadow-lg hover:bg-[#1a384c]/50 active:scale-95 whitespace-nowrap"
                >
                  All Markets
                </TabsTrigger>
                {leagues.map(league => (
                  <TabsTrigger 
                    key={league}
                    value={league}
                    className="bg-[#1a384c]/30 data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded border border-[#1a384c] text-white/50 data-[state=active]:border-primary transition-all shadow-lg hover:bg-[#1a384c]/50 active:scale-95 whitespace-nowrap"
                  >
                    {league}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {showRightArrow && (
              <button 
                onClick={() => scroll('right')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-[#0f212e]/90 hover:bg-[#1a384c] text-white p-2 rounded-full shadow-2xl transition-all border border-white/10 backdrop-blur-md hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Fade effect */}
            <div className={cn(
              "absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#0f212e] to-transparent pointer-events-none transition-opacity duration-300",
              showRightArrow ? "opacity-100" : "opacity-0"
            )} />
            <div className={cn(
              "absolute left-0 top-0 bottom-3 w-16 bg-gradient-to-r from-[#0f212e] to-transparent pointer-events-none transition-opacity duration-300",
              showLeftArrow ? "opacity-100" : "opacity-0"
            )} />
          </div>

          <TabsContent value="all" className="m-0 focus-visible:outline-none">
            <div className="flex flex-col rounded overflow-hidden border border-[#1a384c] divide-y divide-[#1a384c]">
              {events.map((event: any) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>

          {leagues.map(league => (
            <TabsContent key={league} value={league} className="m-0 focus-visible:outline-none">
              <div className="flex flex-col rounded overflow-hidden border border-[#1a384c] divide-y divide-[#1a384c]">
                {events.filter(e => e.leagueName === league).map((event: any) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
