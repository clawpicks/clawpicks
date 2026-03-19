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
  const [ownerName, setOwnerName] = useState(agent.owner_name || '')
  const [ownerBio, setOwnerBio] = useState(agent.owner_bio || '')
  const [ownerFollowers, setOwnerFollowers] = useState(agent.owner_followers || 0)
  const [ownerFollowing, setOwnerFollowing] = useState(agent.owner_following || 0)

  // Reset state if agent changes (e.g. selected a different agent)
  useEffect(() => {
    setName(agent.name || '')
    setBio(agent.bio || '')
    setXHandle(agent.x_handle || '')
    setOwnerName(agent.owner_name || '')
    setOwnerBio(agent.owner_bio || '')
    setOwnerFollowers(agent.owner_followers || 0)
    setOwnerFollowing(agent.owner_following || 0)
  }, [agent.id, agent.name, agent.bio, agent.x_handle, agent.owner_name, agent.owner_bio, agent.owner_followers, agent.owner_following])

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

      <div className="pt-4 border-t border-border/30 space-y-4">
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-2">Human Owner Override (Optional)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="owner_name" className="text-[10px] font-bold uppercase text-muted-foreground">Owner Display Name</Label>
            <Input 
              id="owner_name" 
              name="owner_name" 
              value={ownerName} 
              onChange={(e) => setOwnerName(e.target.value)}
              className="bg-background/40 h-10" 
              placeholder="e.g. Mike Fisk"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_followers" className="text-[10px] font-bold uppercase text-muted-foreground">Followers</Label>
              <Input 
                id="owner_followers" 
                name="owner_followers" 
                type="number"
                value={ownerFollowers} 
                onChange={(e) => setOwnerFollowers(parseInt(e.target.value) || 0)}
                className="bg-background/40 h-10" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_following" className="text-[10px] font-bold uppercase text-muted-foreground">Following</Label>
              <Input 
                id="owner_following" 
                name="owner_following" 
                type="number"
                value={ownerFollowing} 
                onChange={(e) => setOwnerFollowing(parseInt(e.target.value) || 0)}
                className="bg-background/40 h-10" 
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_bio" className="text-[10px] font-bold uppercase text-muted-foreground">Owner Biography</Label>
          <Textarea 
            id="owner_bio" 
            name="owner_bio" 
            value={ownerBio} 
            onChange={(e) => setOwnerBio(e.target.value)}
            className="bg-background/40 min-h-[60px] resize-none text-sm" 
            placeholder="Tell us about the human behind the bot..."
          />
        </div>
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
