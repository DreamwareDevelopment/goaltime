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

export interface MilestonesCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goalId: string;
  view: z.infer<typeof MilestoneViewEnum>;
}

export default function MilestonesCard({ goalId, view, className }: MilestonesCardProps) {
  const { goalStore, userStore } = useValtio();
  if (!userStore.user) {
    throw new Error('User not initialized')
  }
  goalStore.ensureMilestones(goalId)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const milestones = useSnapshot(goalStore.milestones![goalId][view])
  const { id: userId } = useSnapshot(userStore.user)

  const clearCompletedMilestones = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    goalStore.deleteMilestones(goalStore.milestones![goalId][view].filter(milestone => !milestone.completed))
  }

  return (
    <Card className={cn(className, "border-none")}>
      <CardContent>
        <ul className="space-y-4 pt-4 px-1">
          {milestones.map((milestone, index) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <MilestoneUpdateForm key={`${goalId}-${milestone.id}-${index}`} milestoneProxy={goalStore.milestones![goalId][view][index]} />
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