'use client';

import { PlateEditor } from "@/plate-ui/plate-editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui-components/accordion";
import { Button } from "@/ui-components/button";
import { Card, CardContent, CardFooter } from "@/ui-components/card";
import { Checkbox } from "@/ui-components/checkbox";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { Trash2 } from "lucide-react";
import { Separator } from "@/ui-components/separator";
import { ScrollArea } from "@/ui-components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { useState } from "react";

export interface Milestone {
  id: number;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: number;
  name: string;
  committed: number;
  completed: number;
  color: string;
  milestones: Milestone[];
}


export interface GoalProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(goal.milestones)
  const [newMilestone, setNewMilestone] = useState<string>("")
  console.log(`GoalCard ${goal.id}`)

  const addMilestone = () => {
    if (newMilestone.trim() !== "") {
      setMilestones([...milestones, { id: Date.now(), text: newMilestone.trim(), completed: false }])
      setNewMilestone("")
    }
  }

  const toggleMilestone = (id: number) => {
    setMilestones(milestones.map(milestone =>
      milestone.id === id ? { ...milestone, completed: !milestone.completed } : milestone
    ))
  }

  const deleteMilestone = (id: number) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id))
  }

  const clearCompletedMilestones = () => {
    setMilestones(milestones.filter(milestone => !milestone.completed))
  }

  return (
    <ScrollArea className="w-full h-full" key={goal.id}>
      <Accordion type="single" collapsible className="w-full h-full">
        <AccordionItem value="milestones" className="border-none">
          <AccordionTrigger className="text-xl font-bold px-8">Milestones</AccordionTrigger>
          <AccordionContent className="w-full h-full">
            <Tabs defaultValue="daily" className="w-full">
              <div className="w-full pl-6 pr-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="daily">
                <Card className="w-full h-full border-none shadow-none">
                  <CardContent>
                    <ul className="space-y-4">
                      {goal.milestones.map((milestone) => (
                        <li key={milestone.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`milestone-${milestone.id}`}
                            checked={milestone.completed}
                            onCheckedChange={() => toggleMilestone(milestone.id)}
                          />
                          <label
                            htmlFor={`milestone-${milestone.id}`}
                            className={`flex-grow ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {milestone.text}
                          </label>
                          <Button
                            className="flex-shrink-0"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMilestone(milestone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                      <li className="flex items-center space-x-4 pt-4 pr-3">
                        <FloatingLabelInput
                          className="flex-grow"
                          type="text"
                          label="Add a new milestone..."
                          value={newMilestone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
                        />
                        <Button onClick={addMilestone}>Add</Button>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
                    <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="lifetime">
                <Card className="w-full h-full border-none shadow-none">
                  <CardContent>
                    <ul className="space-y-4">
                      {milestones.map((milestone) => (
                        <li key={milestone.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`milestone-${milestone.id}`}
                            checked={milestone.completed}
                            onCheckedChange={() => toggleMilestone(milestone.id)}
                          />
                          <label
                            htmlFor={`milestone-${milestone.id}`}
                            className={`flex-grow ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {milestone.text}
                          </label>
                          <Button
                            className="flex-shrink-0"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMilestone(milestone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                      <li className="flex items-center space-x-4 pt-4 pr-3">
                        <FloatingLabelInput
                          className="flex-grow"
                          type="text"
                          label="Add a new milestone..."
                          value={newMilestone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
                        />
                        <Button onClick={addMilestone}>Add</Button>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
                    <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
                  </CardFooter>
                </Card>
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
          <AccordionTrigger className="text-xl font-bold px-8">Settings</AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            TODO: Add settings
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}