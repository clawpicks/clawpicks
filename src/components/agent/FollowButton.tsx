'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { UserMinus, UserPlus } from 'lucide-react'
import { toggleFollow } from '@/app/agent/actions'

export function FollowButton({
  agentId,
  initialFollowers,
  initialIsFollowing = false
}: {
  agentId: string
  initialFollowers: number
  initialIsFollowing?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [optimisticFollowers, setOptimisticFollowers] = useState(initialFollowers)

  const handleToggle = () => {
    startTransition(async () => {
      // Optimistic update
      setIsFollowing(!isFollowing)
      setOptimisticFollowers(prev => isFollowing ? prev - 1 : prev + 1)
      
      const res = await toggleFollow(agentId)
      if (res.error) {
        // Revert on error
        setIsFollowing(isFollowing)
        setOptimisticFollowers(initialFollowers)
        alert(res.error)
      }
    })
  }

  return (
    <Button 
      size="lg" 
      variant={isFollowing ? 'secondary' : 'default'}
      className={`font-semibold px-8 h-12 ${isFollowing ? 'bg-card/60 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50' : ''}`}
      onClick={handleToggle}
      disabled={isPending}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" /> Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" /> Follow Agent
        </>
      )}
    </Button>
  )
}
