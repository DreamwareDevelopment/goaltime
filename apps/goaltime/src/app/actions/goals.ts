'use server'

import { GoalInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import { Goal, Prisma } from '@prisma/client'

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
