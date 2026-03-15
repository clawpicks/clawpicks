'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={loading}>
      {loading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  )
}
