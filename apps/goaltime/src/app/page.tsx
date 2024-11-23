'use client'

import React from 'react'

import { UserAvatar } from "@/ui-components/avatar-user"
import { GoalCarousel } from '../components/GoalCarousel'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { GoalScheduleCard } from '../components/GoalScheduleCard'
import { ActionsCard } from '../components/ActionsCard'
import { GoalyticsCard } from '../components/GoalyticsCard'
import { GoalCreationButton } from '../components/GoalCreationButton'
import { Goal } from '../components/GoalSetupCard'
import { Milestone, MilestoneView } from '../components/MilestonesCard'

export default function Dashboard() {
  const milestones: Milestone[] = [
    { id: 1, text: "Review project proposal", completed: false, view: MilestoneView.Daily },
    { id: 2, text: "Prepare for team meeting", completed: true, view: MilestoneView.Daily },
    { id: 3, text: "Update progress report", completed: false, view: MilestoneView.Daily },
  ];
  const goals: Goal[] = [
    { id: 1, title: "Startup Work", commitment: 20, completed: 18, color: "#8884d8", milestones, priority: 'High', preferredTimes: [] },
    { id: 2, title: "Exercise", commitment: 5, completed: 4, color: "#82ca9d", milestones, priority: 'High', preferredTimes: [] },
    { id: 3, title: "Learning Spanish", commitment: 3, completed: 2, color: "#ffc658", milestones, priority: 'Medium', preferredTimes: [] },
    { id: 4, title: "Reading", commitment: 10, completed: 7, color: "#ff7f50", milestones, priority: 'Low', preferredTimes: [] },
    { id: 5, title: "Meditation", commitment: 7, completed: 5, color: "#6a5acd", milestones, priority: 'Medium', preferredTimes: [] },
    { id: 6, title: "Cooking", commitment: 8, completed: 6, color: "#48d1cc", milestones, priority: 'High', preferredTimes: [] }
  ]

  const schedule = [
    { id: 1, name: "Startup Work", time: "10:00 AM - 12:00 PM", callEnabled: true, messageEnabled: false, pushEnabled: false },
    { id: 2, name: "Exercise", time: "1:00 PM - 2:00 PM", callEnabled: false, messageEnabled: true, pushEnabled: false },
    { id: 3, name: "Learning Spanish", time: "7:00 PM - 8:00 PM", callEnabled: true, messageEnabled: true, pushEnabled: true },
    { id: 4, name: "Reading", time: "3:00 PM - 4:00 PM", callEnabled: false, messageEnabled: false, pushEnabled: true },
    { id: 5, name: "Meditation", time: "6:00 AM - 6:30 AM", callEnabled: false, messageEnabled: false, pushEnabled: false },
    { id: 6, name: "Cooking", time: "5:00 PM - 6:00 PM", callEnabled: true, messageEnabled: false, pushEnabled: false },
  ]

  return (
    <div className="w-full 2xl:w-[67%] mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goal Time</h1>
        <GoalCreationButton />
        <UserAvatar image="https://github.com/shadcn.png" name="John Doe" email="john.doe@example.com" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalCarousel goals={goals} className="md:col-span-2 overflow-hidden" />
        <GoalProgressCard goals={goals} />
        <GoalScheduleCard schedule={schedule} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <ActionsCard />
        <GoalyticsCard goals={goals} className="md:col-span-2" />
      </div>
    </div>
  )
}
