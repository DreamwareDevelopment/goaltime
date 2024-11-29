'use server'

import { SupabaseClient, User } from '@supabase/supabase-js'
import { UserProfileSchema } from '@/shared/zod'
import { UserProfile } from '@/shared/models'

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
