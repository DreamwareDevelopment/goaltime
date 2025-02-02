import { proxy } from 'valtio'

import { UserProfile } from "@prisma/client"
import { UserProfileInput } from "@/shared/zod"
import { createUserProfileAction, updateUserProfileAction } from '../../../app/actions/user'
import { createClient } from '@/ui-components/hooks/supabase'
import { SanitizedUser } from '@/shared/utils'
import { WebsocketHandler } from '../websocketConsumer'

export const userStore = proxy<{
  user: SanitizedUser | null,
  profile: UserProfile | null,
  websocketHandler: WebsocketHandler | null,
  createUserProfile(user: SanitizedUser, profile: UserProfileInput): Promise<void>,
  updateUserProfile(original: UserProfile, profile: Partial<UserProfileInput>): Promise<void>,
  uploadProfileImage(userId: string, image: File): Promise<string>,
  setProfile(profile: UserProfile): void,
  init(user: SanitizedUser, profile: UserProfile, websocketHandler: WebsocketHandler): void,
}>({
  user: null,
  websocketHandler: null,
  profile: null,
  init(user, profile, websocketHandler) {
    this.user = user
    this.profile = profile
    this.websocketHandler = websocketHandler
  },
  setProfile(profile: UserProfile) {
    if (this.profile) {
      this.profile = {
        ...this.profile,
        ...profile,
      }
    }
  },
  async createUserProfile(user, profile) {
    console.log('createUserProfile called')
    const userProfile = await createUserProfileAction(user, profile)
    this.profile = userProfile
  },
  async updateUserProfile(original, profile) {
    const userProfile = await updateUserProfileAction(original, profile)
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
