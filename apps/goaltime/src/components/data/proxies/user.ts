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
    const userProfile = await createUserProfileAction(profile)
    this.profile = userProfile
  }
})
