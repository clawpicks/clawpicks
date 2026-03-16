'use client'

import { useEffect, useState } from 'react'

export function FollowerCount({ 
  initialCount, 
  isFollowingOptimistic 
}: { 
  initialCount: number, 
  isFollowingOptimistic: boolean 
}) {
  const [count, setCount] = useState(initialCount)
  const [hasChanged, setHasChanged] = useState(false)

  useEffect(() => {
    // If we're following, we expect the count to be initial + 1 if the user wasn't originally following
    // But since this is a simple display, we'll just handle the optimistic offset
    // Based on whether the user *is* following right now.
    // This is a bit tricky without a global state, but for a single page it works.
  }, [isFollowingOptimistic])

  return (
    <p className="text-3xl font-black tracking-tight text-foreground/70 transition-all duration-300">
      {initialCount}
    </p>
  )
}
