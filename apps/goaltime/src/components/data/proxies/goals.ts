import { proxy } from 'valtio'

import { Goal, UserProfile } from "@/shared/models"
import { GoalSchema, GoalUpdateSchema } from "@/shared/zod"
import { createGoalAction, updateGoalAction } from '../../../app/actions/goals'

export const goalStore = proxy<{
  goals: Goal[],
  updateGoal(profile: UserProfile, id: string, update: Partial<Goal>): Promise<void>,
  createGoal(profile: UserProfile, object: Partial<Goal>): Promise<void>
}>({
  goals: [],
  async createGoal(profile, object) {
    const validated = GoalSchema.parse(object)

    await createGoalAction(profile, validated)
  },
  async updateGoal(profile, id, update) {
    const validated = GoalUpdateSchema.parse(update)
    const index = goalStore.goals.findIndex(g => g.id === id)
    if (index >= 0) {
      await updateGoalAction(profile, id, validated)
    }
    throw new Error(`Goal ${id} not found`)
  }
})
