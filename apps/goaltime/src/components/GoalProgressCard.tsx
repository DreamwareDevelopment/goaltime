"use client"

import { cn } from "@/libs/ui-components/src/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui-components/card"
import { Progress } from "@/ui-components/progress"

import { Goal } from "./GoalSettingsCard"
import { GoalCreationButton } from "./GoalCreationButton";

export interface GoalProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goals: Goal[]
}

export function GoalProgressCard({ goals, className }: GoalProgressCardProps) {
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