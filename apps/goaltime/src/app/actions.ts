'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/next-server'

export async function loginAction(formData: FormData, captchaToken: string) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
    options: {
      captchaToken,
    },
  })
  if (error) {
    console.error('Login error', error)
    redirect('/login?error=Invalid email or password')
  }

  redirect('/dashboard')
}

export async function signupAction(formData: FormData, captchaToken: string) {
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
    },
  })

  if (error) {
    console.error('Signup error', error)
    redirect('/error')
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
