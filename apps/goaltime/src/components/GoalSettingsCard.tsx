'use client'

import { Save } from 'lucide-react'
import React, { useState } from 'react'

import { cn } from '@/libs/ui-components/src/utils'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'

import { Milestone } from './MilestonesCard'
import { defaultNotificationSettings, NotificationSettings } from './Settings/Notifications'
import { PreferredTimes, TimeSlot } from './Settings/PreferredTimes'
import { ColorPicker } from './Settings/ColorPicker'
import { PrioritySelector, Priority } from './Settings/PrioritySelector'
import { CommitmentInput, DescriptionInput, TitleInput } from './Settings/Inputs'

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
  notifications: NotificationSettings;
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
  notifications: defaultNotificationSettings,
});

export interface GoalSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  goal?: Goal;
  showTitle?: boolean;
}

export function GoalSettingsCard({ goal, showTitle = false, className }: GoalSettingsCardProps) {
  // TODO: Use an atom for this and calculate on load and on new goal
  const unusedColor = 'red';
  // TODO: Proper state management
  const [currentGoal, setCurrentGoal] = useState<Goal>(goal ?? defaultGoal(unusedColor))

  const handleSave = () => {
    if (currentGoal.title && currentGoal.commitment > 0) {
      setCurrentGoal(defaultGoal(unusedColor))
      // TODO: Save goal
    }
  }

  return (
    <Card className={cn("border-none", className)}>
      { showTitle && <CardHeader className="pb-5">
        <CardTitle className="text-2xl font-bold">Set Your Goal</CardTitle>
      </CardHeader> }
      <CardContent className="space-y-6">
        <TitleInput goal={currentGoal} />
        <DescriptionInput goal={currentGoal} />
        <div className="flex flex-row flex-wrap w-full gap-5">
          <CommitmentInput goal={currentGoal} />
          <PrioritySelector goal={currentGoal} />
          <ColorPicker goal={currentGoal} />
        </div>
        <PreferredTimes goal={currentGoal} />
        <NotificationSettings goal={currentGoal} />
        <ShinyButton variant="gooeyLeft" className="w-full max-w-[707px] ml-[2px] text-white" onClick={handleSave} style={{ backgroundColor: currentGoal.color }}>
          <Save className="mr-2 h-4 w-4" /> Save Goal
        </ShinyButton>
      </CardContent>
    </Card>
  )
}
