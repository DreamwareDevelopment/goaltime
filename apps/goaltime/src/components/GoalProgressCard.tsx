"use client"

import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui-components/card"
import { Progress } from "@/ui-components/progress"
import { GoalCreationButton } from "./GoalCreationButton"
import { useValtio } from "./data/valtio"
import { useSnapshot } from "valtio"
import { ScrollArea } from "@/ui-components/scroll-area"
import CircularGauge from "./CircularGauge"
import { Goal } from "@prisma/client"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/ui-components/tooltip";
import { useMediaQuery } from "@/ui-components/hooks/use-media-query"
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons"

export function GoalProgressCard() {
  const { goalStore } = useValtio()
  if (!goalStore.goals) {
    throw new Error('Invariant: Goals not initialized before using GoalProgressCard')
  }
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const goals = useSnapshot(goalStore.goals) as Goal[]
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const goalAggregates = useSnapshot(goalStore.goalAggregates!)

  return (
    <ScrollArea className="h-full w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-xl">Goals</CardTitle>
        <CardDescription>Your current goals and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center">
          <CircularGauge goals={goals} size={isDesktop ? 300 : 275} className="mb-6 pr-3" />
        </div>
        {goals.map((goal) => {
          const aggregate = goalAggregates[goal.id]
          return (
            <div key={goal.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{goal.title}</span>
                <span className="hidden md:block text-sm text-muted-foreground">
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                  {parseFloat(goal.completed.toFixed(2)).toString()}/{parseFloat((goal.commitment ?? goal.estimate!).toFixed(2)).toString()} hours completed
                </span>
              </div>
              <Progress
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                value={(goal.completed / (goal.commitment ?? goal.estimate!)) * 100}
                className="h-3 mb-2"
                color={goal.color}
                duration={`${goals.length * 0.5 - 0.2}s`}
              />
              <div className="flex flex-wrap justify-between items-center w-full">
                <span className="block md:hidden text-sm text-center text-muted-foreground">
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                  {parseFloat(goal.completed.toFixed(2)).toString()}/{parseFloat((goal.commitment ?? goal.estimate!).toFixed(2)).toString()} hours completed
                </span>
                <div className="flex justify-center items-center gap-1">
                  <span className="block text-sm text-center text-muted-foreground">
                    {parseFloat((aggregate / 60).toFixed(2)).toString()} hour{parseFloat((aggregate / 60).toFixed(2)).toString() === '1' ? '' : 's'} remaining
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <QuestionMarkCircledIcon className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        This is the amount of time you have<br />remaining on your schedule for this goal.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
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