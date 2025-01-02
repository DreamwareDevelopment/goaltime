"use client"

import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui-components/card"
import { Progress } from "@/ui-components/progress"
import { GoalCreationButton } from "./GoalCreationButton"
import { useValtio } from "./data/valtio"
import { useSnapshot } from "valtio"
import { ScrollArea } from "@/ui-components/scroll-area"

export function GoalProgressCard() {
  const { goalStore } = useValtio()
  if (!goalStore.goals) {
    throw new Error('Invariant: Goals not initialized before using GoalProgressCard')
  }
  const goals = useSnapshot(goalStore.goals)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const goalAggregates = useSnapshot(goalStore.goalAggregates!)

  return (
    <ScrollArea className="h-full w-full">
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <CardDescription>Your current goals and progress</CardDescription>
      </CardHeader>
      <CardContent>
        {goals.map((goal) => {
          const aggregate = goalAggregates[goal.id]
          return (
            <div key={goal.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{goal.title}</span>
                {aggregate && <span className="text-sm text-muted-foreground">{(aggregate / 60).toFixed(2)} hours scheduled</span>}
                <span className="hidden md:block text-sm text-muted-foreground">
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                  {goal.completed}/{goal.commitment ?? goal.estimate!} hours
                </span>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              <Progress value={(goal.completed / (goal.commitment ?? goal.estimate!)) * 100} className="h-2" color={goal.color} />
              <span className="block md:hidden text-sm text-center text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                {goal.completed}/{goal.commitment ?? goal.estimate!} hours
              </span>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="flex justify-center">
        <GoalCreationButton className="md:min-w-[258px]" />
      </CardFooter>
    </ScrollArea>
  )
}