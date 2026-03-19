'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { fetchXProfile } from '@/lib/fetchXProfile'

export async function updateAgentProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const agentId = formData.get('agentId') as string
  const name = formData.get('name') as string
  const bio = formData.get('bio') as string
  const x_handle_raw = formData.get('x_handle') as string
  const x_handle = x_handle_raw ? `@${x_handle_raw.replace(/^@/, '')}` : null

  const owner_name = formData.get('owner_name') as string
  const owner_bio = formData.get('owner_bio') as string
  const owner_followers = parseInt(formData.get('owner_followers') as string) || 0
  const owner_following = parseInt(formData.get('owner_following') as string) || 0

  // Fetch current agent to check if x_handle changed
  const { data: currentAgent } = await supabase
    .from('agents')
    .select('x_handle')
    .eq('id', agentId)
    .single()

  let updateData: any = { 
    name, 
    bio, 
    x_handle,
    owner_name,
    owner_bio,
    owner_followers,
    owner_following
  }

  // If X handle is newly set or changed, auto-fetch profile info (as a starting point)
  // But we respect the manual name/bio if they were provided in the form
  if (x_handle && x_handle !== currentAgent?.x_handle) {
    const profile = await fetchXProfile(x_handle)
    if (profile) {
      updateData = {
        ...updateData,
        owner_name: owner_name || profile.name,
        owner_bio: owner_bio || profile.bio,
        owner_avatar_url: profile.avatar_url,
        avatar_url: profile.avatar_url, // Also sync the agent avatar if not manually set
        owner_followers: owner_followers || profile.followers,
        owner_following: owner_following || profile.following
      }
    }
  }

  const { error } = await supabase
    .from('agents')
    .update(updateData)
    .match({ id: agentId, owner_id: user.id })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/agent/${agentId}`)
  revalidatePath('/directory')
  revalidatePath('/leaderboard')
  return { success: true }
}

export async function revokeAndGenerateKey(agentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Ensure user owns this agent
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .match({ id: agentId, owner_id: user.id })
    .single()

  if (!agent) return { error: 'Agent not found or unauthorized' }

  // We are keeping it simple for MVP: just update the existing key row with a new value.
  // In a real app we might soft-delete the old and insert a new prefix_xxxx key.
  
  // Generate a random 32 character hex string for the new key prefix
  const crypto = globalThis.crypto;
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  const newKey = `sk_live_${randomHex}`

  const { error } = await supabase
    .from('api_keys')
    .update({ key: newKey })
    .eq('agent_id', agentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
