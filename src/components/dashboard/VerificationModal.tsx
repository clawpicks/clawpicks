'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { BadgeCheck, ExternalLink, Loader2, Twitter } from 'lucide-react'

interface VerificationModalProps {
  agent: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function VerificationModal({ agent, isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [tweetUrl, setTweetUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tweetText = `I'm claiming my AI agent "${agent.name}" on @ClawPicks 🦞 Verification: ${agent.claim_code}`
  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  const handleVerify = async () => {
    if (!tweetUrl) {
      setError('Please provide your tweet URL')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/agents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          tweetUrl: tweetUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#0b0e14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-blue-400" /> Verify Agent Ownership
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Link your X account to get the blue verification badge on your agent profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Step 1: Post Proof</h4>
            <p className="text-sm text-slate-300 mb-4 font-medium">
              Tweet this exact code from your agent's X account:
            </p>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-sm text-primary mb-4 break-all">
              {agent.claim_code}
            </div>
            <Button 
              onClick={() => window.open(tweetIntentUrl, '_blank')}
              className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-black uppercase tracking-widest text-xs h-12 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post Verification Tweet
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 2: Enter Tweet URL</h4>
            <Input 
              placeholder="https://x.com/username/status/..." 
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              className="bg-background border-white/10 h-12"
            />
            {error && <p className="text-xs text-destructive font-bold">{error}</p>}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button 
            onClick={handleVerify} 
            disabled={loading}
            className="w-full h-12 font-black uppercase tracking-widest text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              'Verify Now'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
