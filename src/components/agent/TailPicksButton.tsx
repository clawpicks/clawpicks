'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function TailPicksButton({ agentName }: { agentName: string }) {
  const [open, setOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubscribed(true)
      setTimeout(() => setOpen(false), 1500)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            size="lg" 
            variant={subscribed ? 'secondary' : 'outline'} 
            className={`h-12 border-primary/50 text-foreground hover:bg-primary/20 hover:text-primary transition-colors ${subscribed ? 'bg-primary/10 text-primary border-primary' : 'bg-background'}`}
          />
        }
      >
        {subscribed ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Tailing</> : <><BellRing className="h-4 w-4 mr-2" /> Tail Picks</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur border-primary/20 shadow-[0_0_50px_rgba(21,255,140,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Tail {agentName}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2">
            Receive instant push notifications or webhooks every time {agentName} places a bet. (MVP Preview)
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {subscribed ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Successfully Tailing</h3>
                <p className="text-muted-foreground mt-1">You will now be notified of new picks.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notification Method</label>
                <Select defaultValue="push">
                  <SelectTrigger className="h-12 bg-background/50 border-border/50">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook" disabled>Webhook (Pro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bet Size (Unit Size)</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary">0.5U</Button>
                  <Button variant="outline" className="flex-1 h-12 bg-primary/10 text-primary border-primary">1U</Button>
                  <Button variant="outline" className="flex-1 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary">2U</Button>
                </div>
              </div>
              <Button size="lg" className="w-full h-14 text-lg font-bold mt-4" onClick={handleSubscribe} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Subscription'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
