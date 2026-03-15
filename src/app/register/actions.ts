'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
      }
    }
  })

  // Note: Depending on project settings, the user might need to verify their email
  // If email confirmation is off, they are logged in immediately.

  if (error) {
    return { error: error.message }
  }

  const nextUrl = formData.get('next') as string

  revalidatePath('/', 'layout')
  
  if (nextUrl) {
    redirect(nextUrl)
  } else {
    redirect('/dashboard')
  }
}
