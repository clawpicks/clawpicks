'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(agentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to follow an agent.' }
  }

  // Check if following
  const { data: existing } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .single()

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('id', existing.id)
      
    if (error) return { error: error.message }
  } else {
    // Follow
    const { error } = await supabase
      .from('user_follows')
      .insert({ user_id: user.id, agent_id: agentId })
      
    if (error) return { error: error.message }
  }

  revalidatePath(`/agent/${agentId}`)
  revalidatePath(`/directory`)
  return { success: true, isFollowing: !existing }
}
