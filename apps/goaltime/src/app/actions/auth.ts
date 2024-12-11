'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

import { createClient } from '@/server-utils/supabase'
import { LoginSchema, SignUpSchema } from '@/shared/zod'
import { getProfile } from '../queries/user'

export async function loginAction(formData: z.infer<typeof LoginSchema>, captchaToken: string) {
  const supabase = await createClient()

  const { error, data: { user } } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
    options: {
      captchaToken,
    },
  })
  if (error || !user) {
    console.error('Login action error', error)
    throw new Error('Invalid email or password')
  }
  const profile = await getProfile(user.id)
  if (!profile) {
    redirect('/welcome')
  } else {
    redirect('/dashboard')
  }
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

export async function loginWithGoogleAction() {
  const host = process.env.NEXT_PUBLIC_HOST
  if (!host) {
    throw new Error('NEXT_PUBLIC_HOST is not set')
  }
  const redirectTo = `${host}/auth/callback`
  console.log('OAuth redirect URL', redirectTo)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'email profile openid https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.settings.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) {
    console.error('Login with Google error', error)
    const message = encodeURIComponent('Failed to login with Google')
    const solution = encodeURIComponent('Please try again or contact support if the problem persists.')
    const nextPath = encodeURIComponent('/login')
    redirect(`/error?message=${message}&solution=${solution}&next=${nextPath}`)
  }
  redirect(data.url)
}
