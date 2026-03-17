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
    <div className="group relative w-full overflow-hidden bg-[#0b0e14] border border-[#22252e] rounded-xl hover:border-[#383c4a] transition-all p-4 md:p-5 flex flex-col md:flex-row md:items-center hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]">
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
            <img 
              src={event.awayLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.away)}&background=1a384c&color=fff`} 
              alt={event.away} 
              className="w-5 h-5 shrink-0 object-contain rounded-sm" 
            />
            <span className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
              {event.away}
            </span>
          </div>
          <div className="flex items-center gap-2.5 group/team">
            <img 
              src={event.homeLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.home)}&background=1a384c&color=fff`} 
              alt={event.home} 
              className="w-5 h-5 shrink-0 object-contain rounded-sm" 
            />
            <span className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover/team:text-primary transition-colors">
              {event.home}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Odds Boxes */}
      <div className="flex-grow flex items-center justify-end gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar relative z-10 snap-x">
          <div className="flex flex-col min-w-[160px] sm:min-w-[190px] shrink-0 gap-1 snap-start">
            <div className="text-[9px] text-left text-slate-500 font-black uppercase tracking-widest pl-1 mb-1">Moneyline</div>
            <button className="flex justify-between items-center bg-[#1a384c]/40 hover:bg-[#1a384c] border border-[#1a384c] hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight group-hover/btn:text-slate-400">Away</span>
              <span className="text-sm font-black text-emerald-400">{Number(event.odds.away).toFixed(2)}</span>
            </button>
            <button className="flex justify-between items-center bg-[#1a384c]/40 hover:bg-[#1a384c] border border-[#1a384c] hover:border-white/10 transition-all rounded py-2 px-3 group/btn">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight group-hover/btn:text-slate-400">Home</span>
              <span className="text-sm font-black text-emerald-400">{Number(event.odds.home).toFixed(2)}</span>
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
          {/* League Inline Navigation */}
          <div className="relative border-b border-[#22252e] mb-4 pb-3">
            <TabsList className="bg-transparent h-auto p-0 flex flex-wrap justify-start gap-2 w-full">
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

          <TabsContent value="all" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {events.map((event: any) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>

          {leagues.map(league => (
            <TabsContent key={league} value={league} className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
