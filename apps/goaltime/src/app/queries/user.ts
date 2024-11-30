import { redirect } from 'next/navigation'

import { createClient } from '@/server-utils/supabase'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/shared/models'
import { getPrismaClient } from '@/server-utils/prisma'

export async function getUser(): Promise<User> {
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

export async function getProfile(userId: User['id']): Promise<UserProfile | null> {
  const prisma = await getPrismaClient()
  const userProfile = await prisma.userProfile.findUnique({
    where: {
      userId,
    },
  })
  return userProfile
}