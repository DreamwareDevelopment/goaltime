'use server'

import z from 'zod'

import { GoalSchema, GoalUpdateSchema } from '@/shared/zod'
import { Goal, UserProfile } from '@/shared/models'
import { getPrismaClient } from '@/server-utils/prisma'

export async function createGoalAction(profile: UserProfile, goal: z.infer<typeof GoalSchema>) {
  const prisma = await getPrismaClient()
  const g = {
    ...goal,
    userId: profile.id,
  }
  // Remove relations from copied goal object
  // fine to mutate since this is on the server, 
  // the client store won't be mutated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (g as any).milestones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (g as any).notifications

  const newGoal = await prisma.goal.create({
    data: {
      ...g,
      milestones: {
        create: goal.milestones,
      },
      notifications: {
        create: goal.notifications,
      },
    },
  })
  // TODO: Schedule notifications
  return newGoal
}

export async function updateGoalAction(previous: Goal, goal: z.infer<typeof GoalUpdateSchema>) {
  const prisma = await getPrismaClient()
  const updatedGoal = await prisma.goal.update({
    where: { id: previous.id },
    data: {
      ...goal,
      milestones: undefined,
      notifications: undefined,
    },
  })
  // TODO: Handle any backend side effects
  return updatedGoal
}
