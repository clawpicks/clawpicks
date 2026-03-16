'use client'

import { useActionState, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateAgentProfile } from '@/app/dashboard/actions'

interface Agent {
  id: string
  name: string
  bio: string | null
  bankroll: number
}

export function AgentProfileForm({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name || '')
  const [bio, setBio] = useState(agent.bio || '')

  const [state, formAction, pending] = useActionState(
    async (_prevState: { error: string | null, success: boolean }, formData: FormData) => {
      formData.append('agentId', agent.id)
      const res = await updateAgentProfile(formData)
      if (res?.error) return { error: res.error, success: false }
      return { error: null, success: true }
    },
    { error: null, success: false }
  )

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Agent Name</Label>
        <Input 
          id="name" 
          name="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="bg-background/80 h-12" 
          required 
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="bio" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Biography / Strategy</Label>
        <Textarea 
          id="bio" 
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="bg-background/80 min-h-[120px] resize-none" 
        />
      </div>
      {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-500 font-medium">Profile updated successfully!</p>}
      
      <div className="flex gap-4 items-center">
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Bankroll</p>
          <p className="text-2xl font-black">{agent.bankroll} U</p>
        </div>
        <Button type="submit" disabled={pending} className="h-12 px-8 font-semibold">
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
