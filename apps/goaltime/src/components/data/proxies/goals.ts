import { proxy } from 'valtio'

import { GoalInput, MilestoneInput } from "@/shared/zod"
import { createGoalAction, createMilestoneAction, deleteGoalAction, deleteMilestoneAction, deleteMilestonesAction, updateGoalAction, updateMilestoneAction } from '../../../app/actions/goals'
import { Goal, Milestone, NotificationSettings } from '@/shared/models'
import { MilestoneViewEnum } from '@/shared/zod'

export const goalStore = proxy<{
  goals: Goal[] | null,
  milestones: Record<string, Record<string, Milestone[]>> | null,
  notifications: Record<string, NotificationSettings> | null,
  updateGoal(input: GoalInput): Promise<void>,
  createGoal(input: GoalInput): Promise<void>,
  deleteGoal(goalId: string, userId: string): Promise<void>,
  updateMilestone(milestone: MilestoneInput): Promise<void>,
  createMilestone(milestone: MilestoneInput): Promise<void>,
  deleteMilestone(milestone: MilestoneInput): Promise<void>,
  deleteMilestones(milestones: MilestoneInput[]): Promise<void>,
  ensureMilestones(goalId: string): void,
  init(goals: Goal[], milestones: Milestone[] | null, notifications: NotificationSettings[]): void,
}>({
  goals: null,
  milestones: null,
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
    if (!goalStore.milestones) {
      goalStore.milestones = {}
    }
    goalStore.milestones[newGoal.id] = {
      [MilestoneViewEnum.Enum.daily]: [],
      [MilestoneViewEnum.Enum.lifetime]: [],
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
  async createMilestone(input) {
    const newMilestone = await createMilestoneAction(input)
    if (!goalStore.milestones) {
      goalStore.milestones = {}
    }
    if (!goalStore.milestones[newMilestone.goalId]) {
      goalStore.milestones[newMilestone.goalId] = {}
    }
    if (!goalStore.milestones[newMilestone.goalId][newMilestone.view]) {
      goalStore.milestones[newMilestone.goalId][newMilestone.view] = []
    }
    goalStore.milestones[newMilestone.goalId][newMilestone.view].push(newMilestone)
  },
  async updateMilestone(input) {
    const updatedMilestone = await updateMilestoneAction(input)
    console.log('updated milestone', updatedMilestone)
    if (!goalStore.milestones || !goalStore.milestones[input.goalId] || !goalStore.milestones[input.goalId][input.view]) {
      throw new Error('Milestones not initialized')
    }
    const index = goalStore.milestones[input.goalId][input.view].findIndex(m => m.id === updatedMilestone.id)
    if (index >= 0) {
      goalStore.milestones[input.goalId][input.view][index] = updatedMilestone
    }
  },
  async deleteMilestone(input) {
    await deleteMilestoneAction(input)
    if (!goalStore.milestones || !goalStore.milestones[input.goalId] || !goalStore.milestones[input.goalId][input.view]) {
      throw new Error('Milestones not initialized')
    }
    const index = goalStore.milestones[input.goalId][input.view].findIndex(m => m.id === input.id)
    if (index >= 0) {
      goalStore.milestones[input.goalId][input.view].splice(index, 1)
    }
  },
  async deleteMilestones(milestones) {
    await deleteMilestonesAction(milestones)
    if (!goalStore.milestones || !goalStore.milestones[milestones[0].goalId]) {
      throw new Error('Milestones not initialized')
    }
    for (const milestone of milestones) {
      const index = goalStore.milestones[milestone.goalId][milestone.view].findIndex(m => m.id === milestone.id)
      if (index >= 0) {
        goalStore.milestones[milestone.goalId][milestone.view].splice(index, 1)
      }
    }
  },
  ensureMilestones(goalId: string) {
    if (!goalStore.milestones) {
      goalStore.milestones = {}
    }
    if (!goalStore.milestones[goalId]) {
      goalStore.milestones[goalId] = {}
    }
    if (!goalStore.milestones[goalId][MilestoneViewEnum.Enum.daily]) {
      goalStore.milestones[goalId][MilestoneViewEnum.Enum.daily] = []
    }
    if (!goalStore.milestones[goalId][MilestoneViewEnum.Enum.lifetime]) {
      goalStore.milestones[goalId][MilestoneViewEnum.Enum.lifetime] = []
    }
  },
  init(goals, milestones, notifications) {
    goalStore.goals = goals
    for (const milestone of milestones ?? []) {
      if (!goalStore.milestones) {
        goalStore.milestones = {}
      }
      if (!goalStore.milestones[milestone.goalId]) {
        goalStore.milestones[milestone.goalId] = {}
      }
      if (!goalStore.milestones[milestone.goalId][milestone.view]) {
        goalStore.milestones[milestone.goalId][milestone.view] = []
      }
      const existingIndex = goalStore.milestones[milestone.goalId][milestone.view].findIndex(m => m.id === milestone.id)
      if (existingIndex >= 0) {
        goalStore.milestones[milestone.goalId][milestone.view][existingIndex] = milestone
      } else {
        goalStore.milestones[milestone.goalId][milestone.view].push(milestone)
      }
    }
    for (const notification of notifications) {
      if (!goalStore.notifications) {
        goalStore.notifications = {}
      }
      goalStore.notifications[notification.goalId] = notification
    }
  },
})
