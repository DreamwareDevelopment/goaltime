'use client';

import { cn } from "@/libs/ui-components/src/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/libs/ui-components/src/components/ui/card"
import { Progress } from "@/libs/ui-components/src/components/ui/progress"
import { Button } from "@/libs/ui-components/src/components/ui/button"
import { Plus } from "lucide-react"
import { Goal } from "./GoalCard"

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
              <span className="font-medium">{goal.name}</span>
              <span className="text-sm text-muted-foreground">
                {goal.completed}/{goal.committed} hours
              </span>
            </div>
            <Progress value={(goal.completed / goal.committed) * 100} className="h-2" color={goal.color} />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add New Goal</Button>
      </CardFooter>
    </Card>
  )
}