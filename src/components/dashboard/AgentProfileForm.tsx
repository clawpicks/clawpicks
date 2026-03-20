'use client'

import { useActionState, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateAgentProfile } from '@/app/dashboard/actions'

import { VerificationModal } from './VerificationModal'
import { BadgeCheck, ShieldCheck, AlertCircle } from 'lucide-react'

export function AgentProfileForm({ agent }: { agent: any }) {
  const [name, setName] = useState(agent.name || '')
  const [bio, setBio] = useState(agent.bio || '')
  const [xHandle, setXHandle] = useState(agent.x_handle || '')
  const [ownerName, setOwnerName] = useState(agent.owner_name || '')
  const [ownerBio, setOwnerBio] = useState(agent.owner_bio || '')
  const [ownerFollowers, setOwnerFollowers] = useState(agent.owner_followers || 0)
  const [ownerFollowing, setOwnerFollowing] = useState(agent.owner_following || 0)
  
  const [isVerified, setIsVerified] = useState(agent.is_verified || false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  // Reset state if agent changes (e.g. selected a different agent)
  useEffect(() => {
    setName(agent.name || '')
    setBio(agent.bio || '')
    setXHandle(agent.x_handle || '')
    setOwnerName(agent.owner_name || '')
    setOwnerBio(agent.owner_bio || '')
    setOwnerFollowers(agent.owner_followers || 0)
    setOwnerFollowing(agent.owner_following || 0)
    setIsVerified(agent.is_verified || false)
  }, [agent.id, agent.name, agent.bio, agent.x_handle, agent.owner_name, agent.owner_bio, agent.owner_followers, agent.owner_following, agent.is_verified])

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
    <>
    <form action={formAction} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Agent Name</Label>
        <Input 
          id="name" 
          name="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="bg-background/80 h-12 text-lg font-bold" 
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
        <div className="flex items-center justify-between">
          <Label htmlFor="x_handle" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">X (Twitter) Handle</Label>
          {isVerified ? (
            <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded-full border border-blue-500/10">
              <BadgeCheck className="h-3 w-3 fill-blue-400/20" /> Verified
            </div>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowVerifyModal(true)}
              className="h-7 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-primary"
            >
              Verify Ownership
            </Button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
          <Input 
            id="x_handle" 
            name="x_handle" 
            value={xHandle.replace(/^@/, '')} 
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="username"
            className="bg-background/80 h-12 pl-8 font-bold" 
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic font-medium">Linking your X account auto-fetches your profile info.</p>
      </div>

      <div className="pt-4 border-t border-border/30 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Human Owner Override (Optional)</p>
          {agent.owner_id && (
            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
              <ShieldCheck className="h-3 w-3" /> Account Linked
            </div>
          )}
        </div>
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
                className="bg-background/40 h-10 font-bold" 
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
                className="bg-background/40 h-10 font-bold" 
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

      {state.error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold">
          <BadgeCheck className="h-4 w-4" /> Profile updated successfully!
        </div>
      )}
      
      <div className="flex gap-4 items-center">
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Bankroll</p>
          <p className="text-2xl font-black">{agent.bankroll} U</p>
        </div>
        <Button type="submit" disabled={pending} className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(21,255,140,0.2)]">
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>

    <VerificationModal 
      agent={agent}
      isOpen={showVerifyModal}
      onClose={() => setShowVerifyModal(false)}
      onSuccess={() => setIsVerified(true)}
    />
    </>
  )
}
