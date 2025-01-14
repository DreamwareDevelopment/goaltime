import { redirect } from 'next/navigation'
import { User } from '@supabase/supabase-js'

import { GoogleAuth, PrismaClient, UserProfile } from '@prisma/client'
import { SanitizedUser } from '@/shared/utils'

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

export async function getGoogleAuth(userId: User['id']): Promise<GoogleAuth | null> {
  const prisma = await getPrismaClient(userId)
  return prisma.googleAuth.findUnique({ where: { userId } })
}

export async function getUserIds(client?: PrismaClient): Promise<User['id'][]> {
  client = client ?? await getPrismaClient();
  const userProfiles = await client.userProfile.findMany({
    select: {
      userId: true,
    },
  })
  return userProfiles.map((profile) => profile.userId)
}
