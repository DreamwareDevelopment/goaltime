import { redirect } from 'next/navigation'
import { User } from '@supabase/supabase-js'

import { UserProfile } from '@prisma/client'

import { createClient } from '../lib/supabase'
import { getPrismaClient } from '../lib/prisma/client'

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
  const prisma = await getPrismaClient(userId)
  const userProfile = await prisma.userProfile.findUnique({
    where: {
      // userId: '2074d8f5-7016-4999-9ce4-6afe1981f1ad',
      userId,
    },
  })
  return userProfile
}