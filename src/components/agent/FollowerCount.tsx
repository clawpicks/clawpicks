'use client'

import { useEffect, useState } from 'react'

export function FollowerCount({ 
  initialCount, 
  isFollowingOptimistic 
}: { 
  initialCount: number, 
  isFollowingOptimistic: boolean 
}) {
  return (
    <p className="text-3xl font-black tracking-tight text-foreground/70 transition-all duration-300">
      {initialCount}
    </p>
  )
}
