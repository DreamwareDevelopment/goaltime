import { Milestone } from "@prisma/client"
import { getPrismaClient } from "../lib/prisma/client"
import { MilestoneViewEnum } from "@/shared/zod"
import { z } from "zod"

export async function getMilestones(goalId: string, userId: string, view: z.infer<typeof MilestoneViewEnum>): Promise<Milestone[]> {
  const prisma = await getPrismaClient(goalId)
  const result = await prisma.milestone.findMany({ 
    where: { goalId, userId, view },
    orderBy: [
      { completed: 'desc' },
      { updatedAt: 'asc' }
    ]
  })
  return result ?? []
}
