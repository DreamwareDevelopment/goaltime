"use client"

import { cn } from "@/ui-components/utils"
import { PlateEditor } from "@/plate-ui/plate-editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui-components/accordion";
import { Separator } from "@/ui-components/separator";
import { ScrollArea } from "@/ui-components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { GoalInput, MilestoneViewEnum, newGoalFromDb } from "@/shared/zod";

import { MilestonesCard } from "./MilestonesCard";
import { GoalSettingsCard } from "./GoalSettingsCard";
import { useToast } from "@/ui-components/hooks/use-toast";
import { useValtio } from "./data/valtio";
import { Goal } from "@/shared/models";
import { useSnapshot } from "valtio";

export interface GoalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal: Goal;
}

export function GoalCard({ goal, className }: GoalCardProps) {
  const { toast } = useToast();
  const { goalStore } = useValtio()
  if (!goalStore.notifications || !goalStore.notifications[goal.id]) {
    throw new Error('Notifications not initialized')
  }
  const notifications = useSnapshot(goalStore.notifications[goal.id])
  goalStore.ensureMilestones(goal.id)

  const handleSubmit = async (input: GoalInput) => {
    try {
      await goalStore.updateGoal(input)
      toast({ title: 'Goal updated', variant: 'default' })
    } catch (error) {
      toast({ title: 'Error updating goal', description: (error as Error).message, variant: 'destructive' })
    }
  }

  return (
    <ScrollArea className={cn(className)} key={goal.id}>
      <Accordion type="single" collapsible defaultValue="milestones" className="w-full h-full">
        <AccordionItem value="milestones" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Milestones</AccordionTrigger>
          <AccordionContent className="w-full h-full">
            <Tabs defaultValue="daily" className="w-full">
              <div className="w-full pl-6 pr-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Today</TabsTrigger>
                  <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="daily">
                <MilestonesCard goalId={goal.id} view={MilestoneViewEnum.Enum.daily} />
              </TabsContent>
              <TabsContent value="lifetime">
                <MilestonesCard goalId={goal.id} view={MilestoneViewEnum.Enum.lifetime} />
              </TabsContent>
            </Tabs>
          </AccordionContent>
        </AccordionItem>
        <div className="pl-6 pr-4">
          <Separator />
        </div>
        <AccordionItem value="notes" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Today&apos;s Notes</AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            <div className="h-full w-full" data-registry="plate">
              <PlateEditor key={goal.id} />
            </div>
          </AccordionContent>
        </AccordionItem>
        <div className="pl-6 pr-4">
          <Separator />
        </div>
        <AccordionItem value="settings" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Goal Settings</AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            <GoalSettingsCard goal={newGoalFromDb(goal, notifications)} userId={goal.userId} handleSubmit={handleSubmit} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}