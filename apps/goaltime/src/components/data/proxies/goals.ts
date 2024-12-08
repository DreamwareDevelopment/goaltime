import { proxy } from 'valtio'

import { GoalInput, MilestoneInput } from "@/shared/zod"
import { createGoalAction, createMilestoneAction, deleteGoalAction, deleteMilestoneAction, deleteMilestonesAction, updateGoalAction, updateMilestoneAction } from '../../../app/actions/goals'
import { Goal, Milestone, NotificationSettings } from '@/shared/models'
import { MilestoneViewEnum } from '@/shared/zod'

export const goalStore = proxy<{
  goals: Goal[] | null,
  milestones: Record<string, Record<string, Milestone[]>> | null,
  milestoneLock: Promise<void> | null,
  notifications: Record<string, NotificationSettings> | null,
  runInMutex(fn: () => Promise<void>): Promise<void>,
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
  milestoneLock: null,
  notifications: null,
  async runInMutex(fn: () => Promise<void>): Promise<void> {
    if (goalStore.milestoneLock) {
      await goalStore.milestoneLock
    }
    goalStore.milestoneLock = new Promise((resolve) => {
      fn().then(() => {
        goalStore.milestoneLock = null
        resolve()
      })
    })
  },
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
    // Optimistically add the milestone to the store
    await goalStore.runInMutex(async () => {
      const createdAt = new Date()
      if (!goalStore.milestones) {
        goalStore.milestones = {}
      }
      if (!goalStore.milestones[input.goalId]) {
        goalStore.milestones[input.goalId] = {}
      }
      if (!goalStore.milestones[input.goalId][input.view]) {
        goalStore.milestones[input.goalId][input.view] = []
      }
      const milestones = goalStore.milestones[input.goalId][input.view]
      milestones.push({
        ...input,
        createdAt,
        id: '',
      })
      const createdMilestone = await createMilestoneAction(input)
      milestones[milestones.length - 1] = createdMilestone
    })
  },
  async updateMilestone(input) {
    await goalStore.runInMutex(async () => {
      if (!goalStore.milestones || !goalStore.milestones[input.goalId] || !goalStore.milestones[input.goalId][input.view]) {
        throw new Error('Milestones not initialized')
      }
      console.log(`Updating milestone ${input.id} for goal ${input.goalId} view ${input.view}`)
      const milestones = goalStore.milestones[input.goalId][input.view]
      const index = milestones.findIndex(m => m.id === input.id)
      if (index >= 0) {
        milestones.splice(index, 1)
      }
      milestones.push(input as Milestone)
      const updatedMilestone = await updateMilestoneAction(input)
      milestones[milestones.length - 1] = updatedMilestone
      console.log(`Updated milestone ${input.id} for goal ${input.goalId} view ${input.view}`)
    })
  },
  async deleteMilestone(input) {
    await goalStore.runInMutex(async () => {
      if (!goalStore.milestones || !goalStore.milestones[input.goalId] || !goalStore.milestones[input.goalId][input.view]) {
        throw new Error('Milestones not initialized')
      }
      console.log(`Deleting milestone ${input.id} from goal ${input.goalId} view ${input.view}`)
      // Optimistically remove the milestone from the store
      const milestones = goalStore.milestones[input.goalId][input.view]
      const index = milestones.findIndex((m) => m.id === input.id)
      if (index >= 0) {
        milestones.splice(index, 1)
      } else {
        throw new Error(`Milestone ${input.id} not found in goal ${input.goalId} view ${input.view}`)
      }
      await deleteMilestoneAction(input)
      console.log('deleted milestone', input.id)
    })
  },
  async deleteMilestones(milestones) {
    await goalStore.runInMutex(async () => {
      if (!goalStore.milestones || !goalStore.milestones[milestones[0].goalId]) {
        throw new Error('Milestones not initialized')
      }
      // Optimistically remove the milestones from the store
      for (const milestone of milestones) {
        console.log(`Deleting milestone ${milestone.id} from goal ${milestone.goalId} view ${milestone.view}`)
        const milestones = goalStore.milestones[milestone.goalId][milestone.view]
        const index = milestones.findIndex((m) => m.id === milestone.id)
        if (index >= 0) {
          milestones.splice(index, 1)
        } else {
          throw new Error(`Milestone ${milestone.id} not found in goal ${milestone.goalId} view ${milestone.view}`)
        }
      }
      await deleteMilestonesAction(milestones)
      console.log(`Deleted milestones ${milestones.map((m) => m.id).join(', ')}`)
    })
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
