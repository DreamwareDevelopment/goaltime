'use client'

import { Save, Palette } from 'lucide-react'
import React, { useState } from 'react'
import { HexColorPicker } from 'react-colorful'

import { cn } from '@/libs/ui-components/src/utils'
import { Button } from '@/ui-components/button'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'
import { FloatingLabelInput } from '@/ui-components/floating-input'
import { Label } from '@/ui-components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-components/tooltip'
import { Input } from '@/ui-components/input'
import { AutosizeTextarea } from '@/ui-components/text-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-components/popover'

import { Milestone } from './MilestonesCard'

export type TimeSlot = 'Early Morning' | 'Morning' | 'Midday' | 'Afternoon' | 'Evening' | 'Night'
export type Priority = 'High' | 'Medium' | 'Low'
const priorities: { [key in Priority]: string } = {
  High: 'Never reschedule',
  Medium: 'Some flexibility',
  Low: 'Very flexible',
}


export interface Goal {
  id: number;
  title: string;
  description?: string;
  commitment: number;
  completed: number;
  priority: Priority;
  preferredTimes: TimeSlot[];
  color: string;
  milestones: Milestone[];
}

const defaultGoal = (color: string): Goal => ({
  id: 0,
  title: '',
  description: '',
  commitment: 3,
  completed: 0,
  priority: 'Medium',
  preferredTimes: [],
  color,
  milestones: [],
});

const timeSlots: { [key in TimeSlot]: string } = {
  'Early Morning': '5-8AM',
  'Morning': '8-11AM',
  'Midday': '11AM-2PM',
  'Afternoon': '2-5PM',
  'Evening': '5-8PM',
  'Night': '8-11PM',
}

const colorPresets = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
]

export interface GoalSetupCardProps extends React.HTMLAttributes<HTMLDivElement> {
  unusedDefaultColor?: string;
}

export default function GoalSetupCard({ color, className }: GoalSetupCardProps) {
  const [currentGoal, setCurrentGoal] = useState<Goal>(defaultGoal(colorPresets[0]))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentGoal(prev => ({ ...prev, [name]: value }))
  }

  const handleTimeSlotToggle = (slot: TimeSlot) => {
    setCurrentGoal(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(slot)
        ? prev.preferredTimes.filter(t => t !== slot)
        : [...prev.preferredTimes, slot]
    }))
  }

  const handleSave = () => {
    if (currentGoal.title && currentGoal.commitment > 0) {
      setCurrentGoal(defaultGoal(colorPresets[0]))
      // onSave(currentGoal)
    }
  }

  return (
    <Card className={cn(className, "border-none")}>
      <CardHeader className="pb-5">
        <CardTitle className="text-2xl font-bold">Set Your Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FloatingLabelInput
          id="title"
          name="title"
          value={currentGoal.title}
          onChange={handleInputChange}
          label="Title"
        />
        <AutosizeTextarea
          id="description"
          name="description"
          value={currentGoal.description || ''}
          onChange={handleInputChange}
          placeholder="Description (optional)"
        />
        <div className="flex flex-row flex-wrap w-full gap-5">
          <div className="space-y-2">
            <Label className="ml-2 text-nowrap" htmlFor="commitment">Weekly Commitment</Label>
            <div className="relative">
              <Input
                id="commitment"
                name="commitment"
                type="number"
                value={currentGoal.commitment}
                onChange={handleInputChange}
                min={0}
                placeholder="Enter..."
                className="pr-10"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                hrs
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="ml-2" htmlFor="priority">Priority Level</Label>
            <Select
              value={currentGoal.priority}
              onValueChange={(value: string) => setCurrentGoal(prev => ({ ...prev, priority: value as Priority }))}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorities).map(([priority, description]) => (
                  <SelectItem key={priority} value={priority}>
                    {priority} - {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-[20px] pt-1">
            <Label className="ml-2">Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: currentGoal.color }} />
                  <Palette className="mr-2 h-4 w-4" />
                  <span>{currentGoal.color}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <HexColorPicker color={currentGoal.color} onChange={(color) => setCurrentGoal(prev => ({ ...prev, color }))} />
                <div className="flex flex-wrap gap-1 mt-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentGoal(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="ml-2">Preferred Time Slots</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(timeSlots).map(([slot, time]) => (
              <TooltipProvider key={slot}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentGoal.preferredTimes.includes(slot as TimeSlot) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSlotToggle(slot as TimeSlot)}
                    >
                      {slot}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{time}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        <ShinyButton variant="gooeyLeft" className="w-full max-w-[707px] ml-[2px]" onClick={handleSave} style={{ backgroundColor: currentGoal.color }}>
          <Save className="mr-2 h-4 w-4" /> Save Goal
        </ShinyButton>
      </CardContent>
    </Card>
  )
}
