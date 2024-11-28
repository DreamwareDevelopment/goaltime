import { redirect } from 'next/navigation'

import { createClient } from './client'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { UserProfileSchema } from '@/shared'
import { UserProfile } from '@/shared/models'

export async function getUser() {
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

export async function createUserProfile(client: SupabaseClient, user: User) {
  const userProfile: UserProfile = UserProfileSchema.parse({
    userId: user.id,
    ...user.user_metadata,
  }) as UserProfile

  const { error } = await client.from('user_profiles').insert<UserProfile>(userProfile)
  if (error) {
    console.error(error)
  }
}
