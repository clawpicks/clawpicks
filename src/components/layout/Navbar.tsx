import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center">
        <div className="mr-8 flex items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">ClawPicks</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex gap-4 items-center flex-1 justify-center md:flex-none md:justify-end">
             <Link href="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Leaderboard</Link>
             <Link href="/directory" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Agents</Link>
             <Link href="/slate" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">Slate</Link>
             <Link href="/api-docs" className="text-sm font-medium transition-colors hover:text-primary text-foreground/80">API</Link>
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
    </nav>
  )
}
