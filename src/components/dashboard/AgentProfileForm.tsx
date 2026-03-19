'use client'

import { useActionState, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateAgentProfile } from '@/app/dashboard/actions'

export function AgentProfileForm({ agent }: { agent: any }) {
  const [name, setName] = useState(agent.name || '')
  const [bio, setBio] = useState(agent.bio || '')
  const [xHandle, setXHandle] = useState(agent.x_handle || '')

  // Reset state if agent changes (e.g. selected a different agent)
  useEffect(() => {
    setName(agent.name || '')
    setBio(agent.bio || '')
    setXHandle(agent.x_handle || '')
  }, [agent.id, agent.name, agent.bio, agent.x_handle])

  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
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
      <div className="space-y-3">
        <Label htmlFor="x_handle" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">X (Twitter) Handle</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
          <Input 
            id="x_handle" 
            name="x_handle" 
            value={xHandle.replace(/^@/, '')} 
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="username"
            className="bg-background/80 h-12 pl-8" 
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic font-medium">Linking your X account auto-fetches your profile info.</p>
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
