'use client'

import { useState } from "react";

import { Label } from "@/ui-components/label";
import { Button } from "@/ui-components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-components/tooltip'

import { Goal } from "../GoalSettingsCard";

export type TimeSlot = 'Early Morning' | 'Morning' | 'Midday' | 'Afternoon' | 'Evening' | 'Night'

const timeSlots: { [key in TimeSlot]: string } = {
  'Early Morning': '5-8AM',
  'Morning': '8-11AM',
  'Midday': '11AM-2PM',
  'Afternoon': '2-5PM',
  'Evening': '5-8PM',
  'Night': '8-11PM',
}

interface PreferredTimesProps {
  goal: Goal;
}

export const PreferredTimes = ({ goal }: PreferredTimesProps) => {
  // TODO: Proper state management
  const [preferredTimes, setPreferredTimes] = useState(goal.preferredTimes);
  const handleTimeSlotToggle = (slot: TimeSlot) => {
    setPreferredTimes(prev => prev.includes(slot) ? prev.filter(t => t !== slot) : [...prev, slot])
  }
  return (
    <div className="space-y-2">
      <Label className="ml-2">Preferred Time Slots</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(timeSlots).map(([slot, time]) => (
          <TooltipProvider key={slot}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={preferredTimes.includes(slot as TimeSlot) ? "default" : "outline"}
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
  )
}