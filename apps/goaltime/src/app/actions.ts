'use server'

import '@/next-server/environment'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/next-server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('data', data)
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    console.error('Login error', error)
    redirect('/login?error=Invalid email or password')
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData, captchaToken: string) {
  const host = process.env.NEXT_PUBLIC_HOST
  if (!host) {
    throw new Error('NEXT_PUBLIC_HOST is not set')
  }

  const redirectTo = new URL('/dashboard', host)
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      captchaToken,
      emailRedirectTo: redirectTo.toString(),
    },
  })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
