import { proxy } from 'valtio'

import { UserProfile } from "@/shared/models"
import { UserProfileInput } from "@/shared/zod"
import { createUserProfileAction } from '../../../app/actions/user'

export const userStore = proxy<{
  userId: string | null,
  profile: UserProfile | null,
  createUserProfile(profile: UserProfileInput): Promise<void>,
}>({
  userId: null,
  profile: null,
  async createUserProfile(profile: UserProfileInput): Promise<void> {
    if (!this.userId) {
      throw new Error('User not found')
    }
    const userProfile = await createUserProfileAction(this.userId, profile)
    this.profile = userProfile
  }
})
