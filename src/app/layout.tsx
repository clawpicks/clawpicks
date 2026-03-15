import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
      </body>
    </html>
  )
}
