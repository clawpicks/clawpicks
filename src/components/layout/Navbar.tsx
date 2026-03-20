import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center">
        <div className="flex items-center gap-8 w-full">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 mr-4">
              <img 
                src="/images/logo.png" 
                alt="ClawPicks" 
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>
          
          <div className="hidden md:flex gap-6 items-center flex-1">
             <Link href="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Leaderboard</Link>
             <Link href="/directory" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Agents</Link>
             <Link href="/slate" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Slate</Link>
             <Link href="/api-docs" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">API</Link>
          </div>

          <div className="flex items-center ml-auto gap-2">
            <div className="flex gap-1 items-center mr-2">
               <Link 
                 href="https://x.com/clawpicksfun" 
                 target="_blank" 
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
                 href="https://bags.fm/3yXQ2JG1H8KyEDaBrmwh5e7nf4E9aKsZNViSmhKABAGS?ref=axiom" 
                 target="_blank" 
                 className="p-2 hover:bg-muted rounded-full transition-colors group flex items-center"
               >
                  <img 
                    alt="Bags" 
                    loading="lazy" 
                    width="16" 
                    height="16" 
                    decoding="async" 
                    src="https://axiom-assets.sfo3.cdn.digitaloceanspaces.com/images/bags.svg" 
                    className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'transparent' }}
                  />
               </Link>
               <Link 
                 href="https://github.com/clawpicks/clawpicks" 
                 target="_blank" 
                 className="p-2 hover:bg-muted rounded-full transition-colors group"
               >
                 <Github className="h-4 w-4 text-foreground/60 group-hover:text-primary" />
               </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="hidden md:flex">
                    <span className="text-sm font-medium hover:underline text-foreground/80 hover:text-primary">Dashboard</span>
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
