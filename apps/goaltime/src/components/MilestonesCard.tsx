'use client';

import { cn } from "@/libs/ui-components/src/utils";
import { Card, CardContent, CardFooter } from "@/ui-components/card";
import { Button } from "@/ui-components/button-shiny";
import { Checkbox } from "@/ui-components/checkbox";
import { FloatingLabelInput } from "@/ui-components/floating-input";
import { Input } from "@/ui-components/input";
import { PlusIcon, Trash2, Check, X } from "lucide-react";

import { Goal } from "./GoalSettingsCard";
import { useState } from "react";

export interface Milestone {
  id: number;
  text: string;
  completed: boolean;
  view: MilestoneView;
}

export enum MilestoneView {
  Daily = "daily",
  Lifetime = "lifetime"
}

export interface MilestonesCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal: Goal;
  view: MilestoneView;
}

export function MilestonesCard({ goal, view, className }: MilestonesCardProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(goal.milestones)
  const [newMilestone, setNewMilestone] = useState<string>("")

  const addMilestone = () => {
    if (newMilestone.trim() !== "") {
      setMilestones([...milestones, { id: Date.now(), text: newMilestone.trim(), completed: false, view: view }])
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

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const startEditing = (milestone: Milestone) => {
    setEditingId(milestone.id)
    setEditText(milestone.text)
  }

  const saveEdit = () => {
    if (editingId) {
      setMilestones(milestones.map(milestone =>
        milestone.id === editingId ? { ...milestone, text: editText } : milestone
      ))
      setEditingId(null)
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
                    onClick={() => deleteMilestone(milestone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
          <li className="flex items-center space-x-4 pt-4 pr-3">
            <FloatingLabelInput
              id={`new-milestone-${goal.id}`}
              className="flex-grow"
              type="text"
              label="I will..."
              value={newMilestone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addMilestone()}
            />
            <Button variant="expandIcon" Icon={PlusIcon} iconPlacement="right" onClick={addMilestone} className="h-[51px]">Add</Button>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="w-full flex flex-row items-center justify-center pb-2">
        <Button className="text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={clearCompletedMilestones}>Clear Completed</Button>
      </CardFooter>
    </Card>
  )
} 