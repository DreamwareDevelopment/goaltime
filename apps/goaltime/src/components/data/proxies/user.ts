import { proxy } from 'valtio'

import { UserProfile } from "@/shared/models"
import { UserProfileInput } from "@/shared/zod"
import { createUserProfileAction, updateUserProfileAction } from '../../../app/actions/user'
import { createClient } from '@/ui-components/hooks/supabase'

export const userStore = proxy<{
  userId: string | null,
  profile: UserProfile | null,
  createUserProfile(profile: UserProfileInput): Promise<void>,
  updateUserProfile(profile: UserProfileInput): Promise<void>,
  uploadProfileImage(userId: string, image: File): Promise<string>,
  setUserProfile(profile: UserProfile): void,
}>({
  userId: null,
  profile: null,
  setUserProfile(profile) {
    this.userId = profile.userId
    this.profile = profile
  },
  async createUserProfile(profile) {
    const userProfile = await createUserProfileAction(profile)
    this.profile = userProfile
  },
  async updateUserProfile(profile) {
    const userProfile = await updateUserProfileAction(profile)
    this.profile = userProfile
  },
  async uploadProfileImage(userId, image) {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('profile_images').upload(`${userId}`, image, { upsert: true })
    if (error) {
      console.error('error uploading profile image', error)
      throw error
    }
    return data.fullPath
  }
})
