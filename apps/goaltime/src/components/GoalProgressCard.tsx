"use client"

import { cn } from "@/ui-components/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui-components/card"
import { Progress } from "@/ui-components/progress"

import { GoalCreationButton } from "./GoalCreationButton";
import { useValtio } from "./data/valtio"
import { useSnapshot } from "valtio";

export function GoalProgressCard({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const { goalStore } = useValtio();
  if (!goalStore.goals) {
    throw new Error('Invariant: Goals not initialized before using GoalProgressCard')
  }
  const goals = useSnapshot(goalStore.goals);
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <CardDescription>Your current goals and progress</CardDescription>
      </CardHeader>
      <CardContent>
        {goals.map((goal) => (
          <div key={goal.id} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{goal.title}</span>
              <span className="text-sm text-muted-foreground">
                {goal.completed}/{goal.commitment} hours
              </span>
            </div>
            <Progress value={(goal.completed / goal.commitment) * 100} className="h-2" color={goal.color} />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-center">
        <GoalCreationButton className="w-[67%]" />
      </CardFooter>
    </Card>
  )
}