import { proxy } from 'valtio'

import { UserProfile } from "@/shared/models"
import { UserProfileInput } from "@/shared/zod"
import { createUserProfileAction, updateUserProfileAction } from '../../../app/actions/user'

export const userStore = proxy<{
  userId: string | null,
  profile: UserProfile | null,
  createUserProfile(profile: UserProfileInput): Promise<void>,
  updateUserProfile(profile: UserProfileInput): Promise<void>,
  setUserProfile(profile: UserProfile): void,
}>({
  userId: null,
  profile: null,
  setUserProfile(profile) {
    this.userId = profile.userId
    this.profile = profile
  },
  async createUserProfile(profile: UserProfileInput): Promise<void> {
    const userProfile = await createUserProfileAction(profile)
    this.profile = userProfile
  },
  async updateUserProfile(profile: UserProfileInput): Promise<void> {
    const userProfile = await updateUserProfileAction(profile)
    this.profile = userProfile
  }
})
