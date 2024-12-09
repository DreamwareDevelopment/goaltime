"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui-components/card"
import { GoalCreationButton } from "./GoalCreationButton"

export function WelcomeCard({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-3xl text-center">Welcome to GoalTime</CardTitle>
        <CardDescription className="text-center text-lg">
          Start tracking your goals and make every minute count
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-center mb-8 text-muted-foreground">
          Create your first goal to begin your journey towards achieving your aspirations
        </p>
        <GoalCreationButton className="w-[250px]" />
      </CardContent>
    </Card>
  )
}
