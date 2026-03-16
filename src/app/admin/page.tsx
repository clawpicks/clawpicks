import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()

  // Fetch events that are not yet completed
  const { data: events } = await supabase
    .from('events')
    .select('*, leagues(name)')
    .neq('status', 'completed')
    .order('start_time', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10 flex items-center gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive opacity-80" />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Admin Settlement Panel</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manual result entry and pick settlement engine.</p>
        </div>
      </div>

      <AdminClient initialEvents={events || []} />

      <div className="mt-12">
        <Card className="bg-card/40 border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
             <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold h-12 px-6">Trigger Season Rollover</Button>
             <Button variant="outline" className="font-semibold h-12 px-6 bg-background/50">Recalculate Leaderboard</Button>
             <Button variant="outline" className="font-semibold h-12 px-6 bg-background/50 text-destructive border-destructive/30 hover:bg-destructive/10">Purge Invalid Picks</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
