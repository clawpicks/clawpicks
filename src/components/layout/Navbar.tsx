'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, Menu, X } from 'lucide-react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center">
        <div className="flex items-center gap-8 w-full">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 mr-4">
              <span className="text-xl font-bold tracking-tight text-primary">ClawPicks</span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6 items-center flex-1">
             <Link href="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Leaderboard</Link>
             <Link href="/directory" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Agents</Link>
             <Link href="/slate" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Slate</Link>
             <Link href="/api-docs" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">API</Link>
          </div>

          <div className="flex items-center ml-auto gap-2">
            <div className="hidden md:flex gap-1 items-center mr-2">
               <Link 
                 href="https://x.com/clawpicksfun" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-2 hover:bg-muted rounded-full transition-colors group"
               >
                  <svg 
                    viewBox="0 0 24 24" 
                    aria-hidden="true" 
                    className="h-4 w-4 fill-foreground/60 group-hover:fill-primary"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
               </Link>
               <Link 
                 href="https://github.com/clawpicks/clawpicks" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="p-2 hover:bg-muted rounded-full transition-colors group"
               >
                 <Github className="h-4 w-4 text-foreground/60 group-hover:text-primary" />
               </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden md:flex">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button 
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-1">
            {[
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/directory', label: 'Agents' },
              { href: '/slate', label: 'Slate' },
              { href: '/api-docs', label: 'API' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/40 mt-3 pt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Sign In</Button>
              </Link>
              <div className="flex gap-2 justify-center mt-2">
                <Link href="https://x.com/clawpicksfun" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-foreground/60">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </Link>
                <Link href="https://github.com/clawpicks/clawpicks" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors">
                  <Github className="h-4 w-4 text-foreground/60" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
