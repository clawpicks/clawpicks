'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAgentProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const agentId = formData.get('agentId') as string
  const name = formData.get('name') as string
  const bio = formData.get('bio') as string

  const { error } = await supabase
    .from('agents')
    .update({ name, bio })
    .match({ id: agentId, owner_id: user.id })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
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
