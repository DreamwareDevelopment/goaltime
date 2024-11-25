'use client';

import { cn } from "@/libs/ui-components/src/utils"
import { PlateEditor } from "@/plate-ui/plate-editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui-components/accordion";
import { Separator } from "@/ui-components/separator";
import { ScrollArea } from "@/ui-components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";

import { MilestonesCard, MilestoneView } from "./MilestonesCard";
import { Goal } from "./GoalSetupCard";
import { NotificationSettings } from "./Settings/Notifications";
import { PreferredTimes } from "./Settings/PreferredTimes";

export interface GoalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal: Goal;
}

export function GoalCard({ goal, className }: GoalCardProps) {
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
                <MilestonesCard goal={goal} view={MilestoneView.Daily} />
              </TabsContent>
              <TabsContent value="lifetime">
                <MilestonesCard goal={goal} view={MilestoneView.Lifetime} />
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
            <PreferredTimes goal={goal} />
            <NotificationSettings goal={goal} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}