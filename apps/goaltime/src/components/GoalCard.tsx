"use client"

import dynamic from 'next/dynamic'
import { useSnapshot } from "valtio";

import { Goal, NotificationSettings } from "@prisma/client";
import { getGoalPreferredTimes, GoalInput } from "@/shared/zod";
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui-components/accordion";
import { toast } from "@/ui-components/hooks/use-toast";
import { ScrollArea } from "@/ui-components/scroll-area";
// import { Separator } from "@/ui-components/separator";
import { LoadingSpinner } from "@/ui-components/svgs/spinner";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { cn } from "@/ui-components/utils"
import { useValtio } from "./data/valtio";

// const PlateEditor = dynamic(() => import('./plate-ui/plate-editor.tsx').then(mod => mod.PlateEditor), {
//   loading: () => (
//     <div className="w-full h-full flex justify-center items-center pt-2">
//       <LoadingSpinner />
//     </div>
//   )
// })
// const MilestonesCard = dynamic(() => import('./MilestonesCard.tsx').then(mod => mod.MilestonesCard), {
//   loading: () => (
//     <div className="w-full h-full flex justify-center items-center pt-2">
//       <LoadingSpinner />
//     </div>
//   )
// })
const GoalSettingsCard = dynamic(() => import('./GoalSettingsCard.tsx').then(mod => mod.GoalSettingsCard), {
  loading: () => (
    <div className="w-full h-full flex justify-center items-center pt-2">
      <LoadingSpinner />
    </div>
  )
})

function getMutableGoal(goal: Goal, notifications: NotificationSettings): GoalInput {
  return {
    ...goal,
    preferredTimes: getGoalPreferredTimes(goal),
    notifications,
  };
}

export interface GoalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal: Goal;
}

export function GoalCard({ goal, className }: GoalCardProps) {
  const { goalStore } = useValtio()
  if (!goalStore.notifications || !goalStore.notifications[goal.id]) {
    throw new Error('Notifications not initialized')
  }
  const notifications = useSnapshot(goalStore.notifications[goal.id])

  const handleSubmit = async (input: GoalInput) => {
    try {
      await goalStore.updateGoal(goal, input)
      toast({ title: 'Goal updated', variant: 'default' })
    } catch (error) {
      toast({ title: 'Error updating goal', description: (error as Error).message, variant: 'destructive' })
    }
  }

  return (
    <ScrollArea className={cn(className, 'w-full h-full flex flex-col justify-center items-center gap-4')} key={goal.id}>
      {/*<Accordion type="single" collapsible defaultValue="milestones" className="w-full h-full">
        <AccordionItem value="milestones" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Milestones</AccordionTrigger>
          <AccordionContent className="w-full h-full">
            <Tabs defaultValue="daily" className="w-full flex flex-col items-center">
              <div className="w-full p-2 sm:px-6 pb-2 pt-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">Today</TabsTrigger>
                  <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="daily" className="w-full">
                <p className="w-full text-center md:text-left px-4 md:px-7 text-xs md:text-sm text-muted-foreground">*These milestones will reset to incomplete each day.</p>
                <MilestonesCard goalId={goal.id} view={MilestoneViewEnum.Enum.daily} />
              </TabsContent>
              <TabsContent value="lifetime" className="w-full">
                <MilestonesCard goalId={goal.id} view={MilestoneViewEnum.Enum.lifetime} />
              </TabsContent>
            </Tabs>
          </AccordionContent>
        </AccordionItem>
        <div className="px-4">
          <Separator />
        </div>
        <AccordionItem value="notes" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">
            <span>Today&apos;s Notes</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-0">
            <div className="h-full w-full bg-secondary-foreground px-2 pb-2" data-registry="plate">
              <PlateEditor key={goal.id} />
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="px-4">
          <Separator />
        </div>
        <AccordionItem value="settings" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Goal Settings</AccordionTrigger>
          <AccordionContent className="p-2 sm:px-6 pb-2 pt-0">
          */}
            <h2 className="text-2xl font-bold text-center py-4">Goal Settings</h2>
            <GoalSettingsCard
              goal={getMutableGoal(goal, notifications)}
              handleSubmit={handleSubmit}
            />
            {/*
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      */}
    </ScrollArea>
  );
}