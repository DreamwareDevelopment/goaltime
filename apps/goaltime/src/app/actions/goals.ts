'use server'

import { GoalInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import { Goal, Prisma } from '@prisma/client'
import { inngest, InngestEvent } from '@/libs/server-utils/src/lib/inngest'
import { isDeepStrictEqual } from 'util'

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
  await inngest.send({
    id: `schedule-new-goal-events-${newGoal.id}`,
    name: InngestEvent.ScheduleGoalEvents,
    data: {
      userId: newGoal.userId,
    },
  })
  return newGoal
}

function shouldScheduleGoals(original: Goal, updated: GoalInput): boolean {
  if (original.allowMultiplePerDay !== updated.allowMultiplePerDay) {
    return true
  }
  if (original.canDoDuringWork !== updated.canDoDuringWork) {
    return true
  }
  if (original.commitment !== updated.commitment) {
    return true
  }
  if (original.deadline !== updated.deadline) {
    return true
  }
  if (original.estimate !== updated.estimate) {
    return true
  }
  if (original.minimumTime !== updated.minimumTime) {
    return true
  }
  if (original.maximumTime !== updated.maximumTime) {
    return true
  }
  if (original.priority !== updated.priority) {
    return true
  }
  if (!isDeepStrictEqual(original.preferredTimes, updated.preferredTimes)) {
    return true
  }
  return false
}

export async function updateGoalAction(original: Goal, updated: GoalInput): Promise<Goal> {
  const prisma = await getPrismaClient(updated.userId)
  updated.updatedAt = new Date()
  const updatedGoal = await prisma.goal.update({
    where: { id: updated.id, userId: updated.userId },
    data: {
      ...updated,
      notifications: {
        update: updated.notifications
      },
    },
  })
  if (shouldScheduleGoals(original, updated)) {
    await inngest.send({
      name: InngestEvent.ScheduleGoalEvents,
      data: {
        userId: updated.userId,
      },
    })
  }
  if (original.title !== updated.title || original.description !== updated.description || original.color !== updated.color) {
    await prisma.calendarEvent.updateMany({
      where: {
        userId: updated.userId,
        goalId: updated.id,
      },
      data: {
        title: updated.title,
        description: updated.description,
        color: updated.color,
      },
    })
  }
  return updatedGoal
}

export async function deleteGoalAction(goalId: string, userId: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  await prisma.goal.delete({ where: { id: goalId, userId } })
}
