"use client"

import { PlusIcon, Trash2, Check, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/ui-components/utils";
import { Card, CardContent, CardFooter } from "@/ui-components/card";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import { Button } from "@/ui-components/button";
import { Checkbox } from "@/ui-components/checkbox";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { Input } from "@/ui-components/input";
import { useValtio } from "./data/valtio";
import { useSnapshot } from "valtio";
import { MilestoneInputWithId, MilestoneSchema, MilestoneViewEnum } from "@/shared/zod";
import z from "zod";

export interface MilestonesCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goalId: string;
  view: z.infer<typeof MilestoneViewEnum>;
}

export function MilestonesCard({ goalId, view, className }: MilestonesCardProps) {
  const { goalStore, userStore } = useValtio();
  if (!userStore.user) {
    throw new Error('User not initialized')
  }
  goalStore.ensureMilestones(goalId)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const milestones = useSnapshot(goalStore.milestones![goalId][view])
  const { id: userId } = useSnapshot(userStore.user)

  const [newMilestone, setNewMilestone] = useState<string>("")
  const addMilestone = async () => {
    if (newMilestone.trim() === "") {
      return
    }
    const data = MilestoneSchema.parse({ goalId, view, text: newMilestone.trim(), userId })
    await goalStore.createMilestone(data)
  }

  const toggleMilestone = async (id: string) => {
    const milestone = milestones.find(milestone => milestone.id === id)
    if (!milestone) {
      return
    }
    await goalStore.updateMilestone(milestone)
  }

  const deleteMilestone = (milestone: MilestoneInputWithId) => {
    goalStore.deleteMilestone(milestone)
  }

  const clearCompletedMilestones = () => {
    goalStore.deleteMilestones(milestones.filter(milestone => !milestone.completed))
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  const startEditing = (milestone: MilestoneInputWithId) => {
    setEditingId(milestone.id)
    setEditText(milestone.text)
  }

  const saveEdit = () => {
    if (editingId) {
      const milestone = milestones.find(milestone => milestone.id === editingId)
      if (milestone) {
        goalStore.updateMilestone(milestone)
      }
    }
    cancelEdit()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  return (
    <Card className={cn(className, "border-none")}>
      <CardContent>
        <ul className="space-y-4 pt-4 px-1">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex items-center space-x-2">
              <Checkbox
                id={`milestone-${milestone.id}`}
                checked={milestone.completed}
                onCheckedChange={() => toggleMilestone(milestone.id)}
              />
              {editingId === milestone.id ? (
                <div className="flex-grow flex items-center space-x-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-grow"
                    autoFocus
                    onBlur={cancelEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onMouseDown={saveEdit} // prevent blur cancelling the edit with onMouseDown
                    className="flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelEdit}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor={`milestone-${milestone.id}`}
                    className={`flex-grow cursor-pointer ${
                      milestone.completed ? "line-through text-muted-foreground" : ""
                    }`}
                    onClick={() => startEditing(milestone)}
                  >
                    {milestone.text}
                  </label>
                  <Button
                    className="flex-shrink-0"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMilestone(milestone)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
          <li className="flex items-center space-x-4 pt-4 pr-3">
            <FloatingLabelInput
              id={`new-milestone-${goalId}`}
              className="flex-grow"
              type="text"
              label="I will..."
              value={newMilestone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
            />
            <ShinyButton variant="expandIcon" Icon={PlusIcon} iconPlacement="right" onClick={addMilestone} className="h-[51px]">Add</ShinyButton>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
        <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
      </CardFooter>
    </Card>
  )
} 