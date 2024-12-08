import { proxy } from 'valtio'

import { UserProfile } from "@/shared/models"
import { UserProfileInput } from "@/shared/zod"
import { createUserProfileAction, updateUserProfileAction } from '../../../app/actions/user'
import { createClient } from '@/ui-components/hooks/supabase'
import { SanitizedUser } from '../../../app/queries/user'

export const userStore = proxy<{
  user: SanitizedUser | null,
  profile: UserProfile | null,
  createUserProfile(profile: UserProfileInput): Promise<void>,
  updateUserProfile(profile: UserProfileInput): Promise<void>,
  uploadProfileImage(userId: string, image: File): Promise<string>,
  init(user: SanitizedUser, profile: UserProfile): void,
}>({
  user: null,
  profile: null,
  init(user, profile) {
    this.user = user
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
    const { data, error } = await supabase.storage.from('profile_images').upload(`${userId}/profile_image`, image, { upsert: true, contentType: image.type })
    if (error) {
      console.error('error uploading profile image', error)
      throw error
    }
    console.log('Finished uploading profile image')
    return data.path
  }
})
