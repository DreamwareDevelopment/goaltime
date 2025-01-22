'use server'

import { GoalInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import { Goal } from '@prisma/client'
import { isDeepStrictEqual } from 'util'
import { inngest, InngestEvent } from '@/server-utils/inngest'
import { GoalWithNotifications } from '@/shared/utils'
import { zep } from '@/server-utils/ai'

// TODO: Use a more minimal goal schema
async function upsertGoalToGraph(goal: Goal): Promise<void> {
  await zep.graph.add({
    type: "json",
    userId: goal.userId,
    data: JSON.stringify({
      goal,
    }),
  })
}

export async function createGoalAction(goal: GoalInput): Promise<GoalWithNotifications> {
  delete goal.preferredTimes.Everyday
  delete goal.preferredTimes.Weekdays
  delete goal.preferredTimes.Weekends
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
  await upsertGoalToGraph(newGoal)
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
  if (original.minimumDuration !== updated.minimumDuration) {
    return true
  }
  if (original.maximumDuration !== updated.maximumDuration) {
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
  delete updated.preferredTimes.Everyday
  delete updated.preferredTimes.Weekdays
  delete updated.preferredTimes.Weekends
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
  // TODO: Fix the race condition here, it should be okay since the db update
  // should be faster than the inngest event, but it's not technically correct.
  // We do want to update the colors of all the events though, not just the ones that get scheduled.
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
  await upsertGoalToGraph(updatedGoal)
  return updatedGoal
}

export async function deleteGoalAction(goalId: string, userId: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  await prisma.goal.delete({ where: { id: goalId, userId } })
  await inngest.send({
    name: InngestEvent.ScheduleUpdated,
    data: {} as never,
  })
}
