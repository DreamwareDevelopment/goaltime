import { redirect } from 'next/navigation'

import { createClient } from '@/server-utils/supabase'
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

export async function getUserAndProfile() {
  const user = await getUser()
  const supabase = await createClient()
  // TODO: Use prisma
  const userProfile = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
  const profile = userProfile.data as UserProfile
  return { user, profile }
}