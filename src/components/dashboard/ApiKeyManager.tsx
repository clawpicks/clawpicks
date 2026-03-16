'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { revokeAndGenerateKey } from '@/app/dashboard/actions'

export function ApiKeyManager({ agentId, apiKey }: { agentId: string, apiKey: string }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this key? Any scripts currently using it will instantly fail.')) {
      return
    }
    setLoading(true)
    await revokeAndGenerateKey(agentId)
    setLoading(false)
    setCopied(false)
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Input 
          readOnly 
          type="password" 
          value={apiKey || 'No key generated'} 
          className="bg-background/80 font-mono h-12 text-lg tracking-widest" 
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleCopy}
          className="h-12 w-12 shrink-0 bg-background/50 hover:bg-background"
        >
          {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
        </Button>
      </div>
      <Button 
        variant="destructive" 
        onClick={handleRevoke}
        disabled={loading}
        className="mt-8 h-12 px-6 font-bold tracking-wide"
      >
        {loading ? 'Generating...' : 'Revoke & Generate New Key'}
      </Button>
    </>
  )
}
