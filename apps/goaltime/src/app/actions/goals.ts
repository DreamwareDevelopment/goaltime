'use server'

import { GoalInput, MilestoneInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import { Goal, Milestone, Prisma } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const goalWithNotifications = Prisma.validator<Prisma.GoalArgs>()({
  include: { notifications: true },
})

export type GoalWithNotifications = Prisma.GoalGetPayload<typeof goalWithNotifications>

export async function createGoalAction(goal: GoalInput): Promise<GoalWithNotifications> {
  const prisma = await getPrismaClient(goal.userId)

  const newGoal = await prisma.goal.create({
    data: {
      ...goal,
      milestones: undefined,
      notifications: {
        create: goal.notifications,
      },
    },
    include: {
      notifications: true,
    },
  })
  // TODO: Schedule notifications
  return newGoal
}

export async function updateGoalAction(goal: GoalInput): Promise<Goal> {
  const prisma = await getPrismaClient(goal.userId)
  goal.updatedAt = new Date()
  const updatedGoal = await prisma.goal.update({
    where: { id: goal.id, userId: goal.userId },
    data: {
      ...goal,
      notifications: {
        upsert: {
          update: goal.notifications,
          create: goal.notifications,
        },
      },
    },
  })
  // TODO: Handle any backend side effects
  return updatedGoal
}

export async function deleteGoalAction(goalId: string, userId: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  await prisma.goal.delete({ where: { id: goalId, userId } })
}

export async function createMilestoneAction(milestone: MilestoneInput): Promise<Milestone> {
  const prisma = await getPrismaClient(milestone.userId)
  const updatedAt = new Date()
  const newMilestone = await prisma.milestone.create({
    data: {
      ...milestone,
      updatedAt,
    },
  })
  return newMilestone
}

export async function updateMilestoneAction(milestone: MilestoneInput): Promise<Milestone> {
  const prisma = await getPrismaClient(milestone.userId)
  const updatedMilestone = await prisma.milestone.update({
    where: { id: milestone.id, userId: milestone.userId },
    data: milestone,
  })
  return updatedMilestone
}

export async function deleteMilestoneAction(milestone: MilestoneInput): Promise<void> {
  const prisma = await getPrismaClient(milestone.userId)
  await prisma.milestone.delete({ where: { id: milestone.id, userId: milestone.userId } })
}

export async function deleteMilestonesAction(milestones: MilestoneInput[]): Promise<void> {
  const prisma = await getPrismaClient(milestones[0].userId)
  await prisma.milestone.deleteMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: { in: milestones.map(m => m.id!) },
      userId: milestones[0].userId,
    },
  })
}
