'use client'

import React from 'react'

import { UserAvatar } from "@/ui-components/avatar-user"
import { GoalCarousel } from '../components/GoalCarousel'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { ActionsCard } from '../components/ActionsCard'
import { GoalyticsCard } from '../components/GoalyticsCard'
import { GoalCreationButton } from '../components/GoalCreationButton'
import { Goal } from '../components/GoalSetupCard'
import { Milestone, MilestoneView } from '../components/MilestonesCard'
import { CalendarEvent, ScheduleCard } from '../components/ScheduleCard'

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
  const schedule: CalendarEvent[] = [
    {
      id: 1,
      title: "Startup Work",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 20 hours of Startup Work",
      startTime: "9:00",
      endTime: "10:00",
      isAllDay: false,
      color: "#8884d8",
    },
    {
      id: 2,
      title: "Exercise",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 5 hours of Exercise",
      startTime: "14:00",
      endTime: "15:00",
      isAllDay: false,
      color: "#82ca9d",
    },
    {
      id: 3,
      title: "Learning Spanish",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 3 hours of Learning Spanish",
      startTime: "17:00",
      endTime: "18:00",
      isAllDay: false,
      color: "#ffc658",
    },
    {
      id: 4,
      title: "Reading",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 10 hours of Reading",
      startTime: "18:30",
      endTime: "19:00",
      isAllDay: false,
      color: "#ff7f50",
    },
    {
      id: 5,
      title: "Meditation",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 7 hours of Meditation",
      startTime: null,
      endTime: null,
      isAllDay: true,
      color: "#6a5acd",
    },
    {
      id: 6,
      title: "Cooking",
      subtitle: "Milestone: Review project proposal",
      description: "Complete 8 hours of Cooking",
      startTime: "22:00",
      endTime: "23:00",
      isAllDay: false,
      color: "#48d1cc",
    }
  ];

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
        <ScheduleCard schedule={schedule} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <ActionsCard />
        <GoalyticsCard goals={goals} className="md:col-span-2" />
      </div>
    </div>
  )
}
