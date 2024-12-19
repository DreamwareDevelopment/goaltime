'use server'

import { MilestoneInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import { Milestone } from '@prisma/client'

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