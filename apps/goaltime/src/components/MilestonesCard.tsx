"use client"

import { useSnapshot } from "valtio";
import z from "zod";

import { MilestoneViewEnum } from "@/shared/zod";
import { Button } from "@/ui-components/button";
import { Card, CardContent, CardFooter } from "@/ui-components/card";
import { cn } from "@/ui-components/utils";
import { useRerender } from "@/ui-components/hooks/rerender";

import { useValtio } from "./data/valtio";
import { MilestoneCreationForm } from "./MilestoneCreationForm";
import { MilestoneUpdateForm } from "./MilestoneUpdateForm";

export interface MilestonesCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goalId: string;
  view: z.infer<typeof MilestoneViewEnum>;
}

export function MilestonesCard({ goalId, view, className }: MilestonesCardProps) {
  const { goalStore, userStore } = useValtio();
  if (!userStore.user) {
    throw new Error('User not initialized')
  }
  goalStore.ensureMilestones(goalId)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const milestones = useSnapshot(goalStore.milestones![goalId][view])
  const { id: userId } = useSnapshot(userStore.user)

  // This is a hack to force a rerender on the client to solve a tough bug where
  // deleted milestones remain in the DOM on the server render, causing them to flash
  // on the client and throw a hydration mismatch error.
  // TODO: Figure out where the state is being kept after deletion. It's not in the proxy or the prisma query results.
  const isHydrated = useRerender()
  if (!isHydrated) {
    return null
  }

  const clearCompletedMilestones = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    goalStore.deleteMilestones(goalStore.milestones![goalId][view].filter(milestone => !milestone.completed))
  }

  return (
    <Card className={cn(className, "border-none")}>
      <CardContent>
        <ul className="space-y-4 pt-4 px-1">
          {milestones.map((milestone) => (
            <MilestoneUpdateForm key={`${goalId}-${milestone.id}-${view}`} milestone={milestone} />
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