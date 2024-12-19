import { proxy } from 'valtio'

import { GoalInput } from "@/shared/zod"
import { createGoalAction, deleteGoalAction, updateGoalAction } from '../../../app/actions/goals'
import { Goal, NotificationSettings } from '@prisma/client'

export const goalStore = proxy<{
  goals: Goal[] | null,
  notifications: Record<string, NotificationSettings> | null,
  updateGoal(input: GoalInput): Promise<void>,
  createGoal(input: GoalInput): Promise<void>,
  deleteGoal(goalId: string, userId: string): Promise<void>,
  init(goals: Goal[], notifications: NotificationSettings[]): void,
}>({
  goals: null,
  notifications: null,
  async createGoal(input) {
    if (!goalStore.goals) {
      throw new Error('Invariant: goals not initialized in goalStore')
    }
    const newGoal = await createGoalAction(input)
    goalStore.goals.push(newGoal)
    if (!goalStore.notifications) {
      goalStore.notifications = {}
    }
    if (newGoal.notifications) {
      goalStore.notifications[newGoal.id] = newGoal.notifications
    }
  },
  async updateGoal(input) {
    if (!goalStore.goals) {
      throw new Error('Invariant: goals not initialized in goalStore')
    }
    const index = goalStore.goals.findIndex(g => g.id === input.id)
    if (index >= 0) {
      const result = await updateGoalAction(input)
      goalStore.goals[index] = result
    }
  },
  async deleteGoal(goalId, userId) {
    if (!goalStore.goals) {
      throw new Error('Invariant: goals not initialized in goalStore')
    }
    await deleteGoalAction(goalId, userId)
    const index = goalStore.goals.findIndex(g => g.id === goalId)
    if (index >= 0) {
      goalStore.goals.splice(index, 1)
    }
  },
  init(goals, notifications) {
    goalStore.goals = goals
    for (const notification of notifications) {
      if (!goalStore.notifications) {
        goalStore.notifications = {}
      }
      goalStore.notifications[notification.goalId] = notification
    }
  },
})
