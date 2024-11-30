'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

import { createClient } from '@/server-utils/supabase'
import { LoginSchema, SignUpSchema } from '@/shared/zod'

export async function loginAction(formData: z.infer<typeof LoginSchema>, captchaToken: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
    options: {
      captchaToken,
    },
  })
  if (error) {
    console.error('Login error', error)
    redirect('/login?error=Invalid email or password')
  }

  redirect('/welcome')
}

export async function signupAction(formData: z.infer<typeof SignUpSchema>, captchaToken: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      captchaToken,
    },
  })

  if (error) {
    console.error('Signup error', error)
    redirect('/error')
  }

  const verificationPage = '/auth/verify?email=' + encodeURIComponent(formData.email)
  revalidatePath(verificationPage, 'layout')
  redirect(verificationPage)
}

export async function resendVerificationAction(email: string) {
  const supabase = await createClient()
  await supabase.auth.resend({ email, type: 'signup' })
}
