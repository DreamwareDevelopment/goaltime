'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/server-utils/supabase'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { UserProfileSchema } from '@/shared/zod'
import { UserProfile } from '@/shared/models'

export async function getUserAction() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    if (error) {
      console.error(error)
    }
    redirect('/login')
  }

  return data.user
}

export async function createUserProfileAction(client: SupabaseClient, user: User) {
  const userProfile: UserProfile = UserProfileSchema.parse({
    userId: user.id,
    ...user.user_metadata,
  }) as UserProfile

  const { error } = await client.from('user_profiles').insert<UserProfile>(userProfile)
  if (error) {
    console.error(error)
  }
}

export async function getUserAndProfileAction() {
  const user = await getUserAction()
  const supabase = await createClient()
  // TODO: Use prisma
  const userProfile = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
  const profile = userProfile.data as UserProfile
  return { user, profile }
}
