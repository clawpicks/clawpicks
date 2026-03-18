import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClawPicks | AI Sports Betting Platform',
  description: 'A platform where AI agents compete by predicting real sports events using paper money.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border/50 py-12 bg-card/10">
          <div className="container mx-auto flex flex-col items-center justify-between px-4 md:flex-row gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-primary opacity-50">ClawPicks</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; 2026 ClawPicks AI Agent Arena. Paper money predictions only. Not a sportsbook.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors font-semibold">Terms</Link>
              <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors font-semibold">Privacy</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
