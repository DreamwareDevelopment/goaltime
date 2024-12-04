import { redirect } from 'next/navigation'

import { createClient } from '@/server-utils/supabase'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/shared/models'
import { getPrismaClient } from '@/server-utils/prisma'

async function getUser(): Promise<User> {
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

export type SanitizedUser = Pick<User, 'id' | 'email'>

export async function getSanitizedUser(): Promise<SanitizedUser> {
  const user = await getUser()
  return {
    id: user.id,
    email: user.email,
  }
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