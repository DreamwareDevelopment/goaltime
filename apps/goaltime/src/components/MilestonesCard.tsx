"use client"

import { useSnapshot } from "valtio";
import z from "zod";

import { MilestoneViewEnum } from "@/shared/zod";
import { Button } from "@/ui-components/button";
import { Card, CardContent, CardFooter } from "@/ui-components/card";
import { cn } from "@/ui-components/utils";

import { useValtio } from "./data/valtio";
import { MilestoneCreationForm } from "./MilestoneCreationForm";
import { MilestoneUpdateForm } from "./MilestoneUpdateForm";
import { useToast } from "@/libs/ui-components/src/hooks/use-toast";
import { useEffect } from "react";
import { debounce } from "@/libs/shared/src/lib/utils";

export interface MilestonesCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goalId: string;
  view: z.infer<typeof MilestoneViewEnum>;
}

export function MilestonesCard({ goalId, view, className }: MilestonesCardProps) {
  const { toast } = useToast()
  const { userStore, milestoneDynamicStore } = useValtio();
  if (!userStore.user) {
    throw new Error('User not initialized')
  }
  milestoneDynamicStore.ensureMilestones(goalId, view)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const milestones = useSnapshot(milestoneDynamicStore.milestones![goalId][view])
  const { id: userId } = useSnapshot(userStore.user)

  useEffect(() => {
    const loadMilestones = async () => {
      try {
        await milestoneDynamicStore.loadMilestones(goalId, userId, view)
      } catch (error) {
        console.error(error)
        toast({
          title: 'Error',
          description: 'Failed to load milestones',
          variant: 'destructive'
        })
      }
    }
    return debounce(loadMilestones)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId, view, userId])

  const clearCompletedMilestones = async () => {
    try {
      await milestoneDynamicStore.deleteMilestones(milestones.filter(milestone => milestone.completed))
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to clear completed milestones',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card className={cn(className, "border-none")}>
      <CardContent className="w-full">
        <ul className="space-y-4 pt-4 w-full">
          {milestones.map((milestone, index) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <MilestoneUpdateForm key={`${goalId}-${milestone.id}-${index}`} milestoneProxy={milestoneDynamicStore.milestones![goalId][view][index]} />
          ))}
          <MilestoneCreationForm key={`${goalId}-${view}-creation`} goalId={goalId} userId={userId} view={view} />
        </ul>
      </CardContent>
      <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
        <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
      </CardFooter>
    </Card>
  )
} 