import { proxy } from 'valtio'

import { Goal, UserProfile } from "@/shared/models"
import { GoalSchema, GoalUpdateSchema } from "@/shared/zod"
import { createGoalAction, updateGoalAction } from '../actions/goals'

export const goalStore = proxy<{
  goals: Goal[],
  updateGoal(id: string, update: Partial<Goal>): Promise<void>,
  createGoal(profile: UserProfile, object: Partial<Goal>): Promise<void>
}>({
  goals: [],
  async createGoal(profile, object) {
    const validated = GoalSchema.parse(object)

    await createGoalAction(profile, validated)
  },
  async updateGoal(id, update) {
    const validated = GoalUpdateSchema.parse(update)
    const index = goalStore.goals.findIndex(g => g.id === id)
    if (index >= 0) {
      // Valtio will only trigger rerenders in components 
      // that actually use this specific goal
      const reference = goalStore.goals[index]
      const previous: Goal = { ...reference }
      Object.assign(reference, update)
      // Server sync
      await updateGoalAction(previous, validated)
    }
  }
})