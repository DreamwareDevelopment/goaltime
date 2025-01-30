import { proxy } from 'valtio'

import { MilestoneViewEnum, MilestoneInput } from "@/shared/zod"
import { createMilestoneAction, deleteMilestoneAction, deleteMilestonesAction, updateMilestoneAction } from '../../../app/actions/milestones'
import { Milestone } from '@prisma/client'
import { z } from 'zod'
import { getTsRestClient } from '@/ui-components/hooks/ts-rest'
import { binarySearchInsert, dayjs } from '@/shared/utils'
import { refreshTokenIfNeeded } from '@/libs/ui-components/src/hooks/supabase'
import { getTokenInfo } from '@/libs/ui-components/src/hooks/supabase'

interface LockHolder {
  lock: Promise<void> | null
}

async function runInMutex(lockHolder: LockHolder, fn: () => Promise<void>): Promise<void> {
  if (lockHolder.lock) {
    await lockHolder.lock
  }
  lockHolder.lock = new Promise((resolve) => {
    fn().then(() => {
      lockHolder.lock = null
      resolve()
    })
  })
}

// Dynamic stores will not have all the data loaded via init, so we need to load the milestones each time we need them
export const milestoneDynamicStore = proxy<{
  milestones: Record<string, Record<string, Milestone[]>> | null,
  ensureMilestones(goalId: string, view: z.infer<typeof MilestoneViewEnum>): void,
  loadMilestones(goalId: string, userId: string, view: z.infer<typeof MilestoneViewEnum>): Promise<void>,
  updateMilestone(milestone: MilestoneInput): Promise<void>,
  createMilestone(milestone: MilestoneInput): Promise<void>,
  deleteMilestone(milestone: MilestoneInput): Promise<void>,
  deleteMilestones(milestones: MilestoneInput[]): Promise<void>,
} & LockHolder>({
  milestones: null,
  lock: null,
  ensureMilestones(goalId: string, view: z.infer<typeof MilestoneViewEnum>) {
    if (!milestoneDynamicStore.milestones) {
      milestoneDynamicStore.milestones = {}
    }
    if (!milestoneDynamicStore.milestones[goalId]) {
      milestoneDynamicStore.milestones[goalId] = {}
    }
    if (!milestoneDynamicStore.milestones[goalId][view]) {
      milestoneDynamicStore.milestones[goalId][view] = []
    }
  },
  async createMilestone(input) {
    await runInMutex(milestoneDynamicStore, async () => {
      console.log(`Creating milestone "${input.text}" for goal ${input.goalId} view ${input.view}`)
      const createdAt = new Date()
      milestoneDynamicStore.ensureMilestones(input.goalId, input.view)

      // Optimistically add the milestone to the store
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const milestones = milestoneDynamicStore.milestones![input.goalId][input.view]
      milestones.push({
        ...input,
        createdAt,
        updatedAt: createdAt,
        id: '',
      })
      try {
        const createdMilestone = await createMilestoneAction(input)
        milestones[milestones.length - 1] = createdMilestone
        console.log(`Created milestone "${input.text}" for goal ${input.goalId} view ${input.view}`)
      } catch (error) {
        console.error(`Error creating milestone "${input.text}" for goal ${input.goalId} view ${input.view}`, error)
        // rollback
        milestones.pop()
        throw error
      }
    })
  },
  async updateMilestone(input) {
    await runInMutex(milestoneDynamicStore, async () => {
      if (!milestoneDynamicStore.milestones || !milestoneDynamicStore.milestones[input.goalId] || !milestoneDynamicStore.milestones[input.goalId][input.view]) {
        throw new Error('Milestones not initialized')
      }
      console.log(`Updating milestone "${input.text}" for goal ${input.goalId} view ${input.view}`)
      const milestones = milestoneDynamicStore.milestones[input.goalId][input.view]
      const originalIndex = milestones.findIndex(m => m.id === input.id)
      let originalMilestone: Milestone | null = null
      if (originalIndex >= 0) {
        originalMilestone = milestones.splice(originalIndex, 1)[0]
      } else {
        throw new Error(`Milestone "${input.text}" not found in goal ${input.goalId} view ${input.view}`)
      }

      // Don't change the order if only the completed status changed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (input as any).updatedAt = originalMilestone.completed === input.completed ? new Date() : originalMilestone.updatedAt
      const newIndex = binarySearchInsert(milestones, input as Milestone, (a, b) => {
        if (a.completed && !b.completed) {
          return -1
        }
        if (!a.completed && b.completed) {
          return 1
        }
        const aTime = dayjs(a.updatedAt).unix()
        const bTime = dayjs(b.updatedAt).unix()
        return aTime - bTime
      })

      try {
        const updatedMilestone = await updateMilestoneAction(input)
        milestones[newIndex] = updatedMilestone
        console.log(`Updated milestone "${input.text}" for goal ${input.goalId} view ${input.view}`)
      } catch (error) {
        console.error(`Error updating milestone "${input.text}" for goal ${input.goalId} view ${input.view}`, error)
        milestones.splice(newIndex, 1)
        milestones.splice(originalIndex, 0, originalMilestone)
        throw error
      }
    })
  },
  async deleteMilestone(input) {
    await runInMutex(milestoneDynamicStore, async () => {
      if (!milestoneDynamicStore.milestones || !milestoneDynamicStore.milestones[input.goalId] || !milestoneDynamicStore.milestones[input.goalId][input.view]) {
        throw new Error('Milestones not initialized')
      }
      console.log(`Deleting milestone "${input.text}" from goal ${input.goalId} view ${input.view}`)
      // Optimistically remove the milestone from the store
      const milestones = milestoneDynamicStore.milestones[input.goalId][input.view]
      const index = milestones.findIndex((m) => m.id === input.id)
      let originalMilestone: Milestone | null = null
      if (index >= 0) {
        originalMilestone = milestones.splice(index, 1)[0]
      } else {
        throw new Error(`Milestone "${input.text}" not found in goal ${input.goalId} view ${input.view}`)
      }
      try {
        await deleteMilestoneAction(input)
        console.log(`Deleted milestone "${input.text}" from goal ${input.goalId} view ${input.view}`)
      } catch (error) {
        console.error(`Error deleting milestone "${input.text}" from goal ${input.goalId} view ${input.view}`, error)
        milestones.splice(index, 0, originalMilestone)
        throw error
      }
    })
  },
  async deleteMilestones(milestones) {
    await runInMutex(milestoneDynamicStore, async () => {
      console.log(`Deleting ${milestones.length} milestones`)
      if (!milestoneDynamicStore.milestones) {
        throw new Error('Milestones not initialized')
      }
      if (!milestones.length) {
        console.log('No milestones to delete')
        return
      }
      // Optimistically remove the milestones from the store
      const originalMilestones: Array<{ milestone: Milestone, index: number }> = []
      for (const milestone of milestones) {
        console.log(`Deleting milestone "${milestone.text}" from goal ${milestone.goalId} view ${milestone.view}`)
        const milestones = milestoneDynamicStore.milestones[milestone.goalId][milestone.view]
        const index = milestones.findIndex((m) => m.id === milestone.id)
        if (index >= 0) {
          originalMilestones.push({ milestone: milestones.splice(index, 1)[0], index })
        } else {
          throw new Error(`Milestone "${milestone.text}" not found in goal ${milestone.goalId} view ${milestone.view}`)
        }
      }
      try {
        await deleteMilestonesAction(milestones)
        console.log(`Deleted milestones ${milestones.map((m) => `"${m.text}"`).join(', ')}`)
      } catch (error) {
        console.error(`Error deleting milestones ${milestones.map((m) => `"${m.text}"`).join(', ')}`, error)
        for (const { milestone, index } of originalMilestones) {
          milestones.splice(index, 0, milestone)
        }
        throw error
      }
    })
  },
  async loadMilestones(goalId, userId, view) {
    milestoneDynamicStore.ensureMilestones(goalId, view)
    let tokenInfo = await getTokenInfo();
    let client = await getTsRestClient(tokenInfo);
    let response = await client.milestones.getMilestones({
      query: {
        goalId,
        userId,
        view,
      },
    });
    if (response.status === 401 || response.status === 403) {
      tokenInfo = await refreshTokenIfNeeded(tokenInfo);
      client = await getTsRestClient(tokenInfo);
      response = await client.milestones.getMilestones({
        query: {
          goalId,
          userId,
          view,
        },
      });
    }
    if (response.status !== 200) {
      console.error(`Error loading milestones for goal ${goalId} view ${view}`, response)
      throw new Error(`Error loading milestones for goal ${goalId} view ${view}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const milestones = milestoneDynamicStore.milestones![goalId][view]
    milestones.splice(0, milestones.length, ...response.body)
  },
})
