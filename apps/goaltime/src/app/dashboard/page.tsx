import React from 'react'

import { getProfile, getSanitizedUser } from '../queries/user'
import { CalendarEvent } from '../../components/ScheduleCard'
import { redirect } from 'next/navigation'
import { getGoals, getMilestones, getNotifications } from '../queries/goal'
import DashboardClient from './client'

const schedule: CalendarEvent[] = [
  {
    id: 1,
    title: "Startup Work",
    subtitle: "Milestone: Review project proposal",
    description: "Complete 20 hours of Startup Work",
    startTime: "9:00",
    endTime: "14:00",
    isAllDay: false,
    color: "#8884d8",
  },
  {
    id: 2,
    title: "Exercise",
    subtitle: "Milestone: Review project proposal",
    description: "Complete 5 hours of Exercise",
    startTime: "13:30",
    endTime: "15:00",
    isAllDay: false,
    color: "#82ca9d",
  },
  {
    id: 3,
    title: "Learning Spanish",
    subtitle: "Milestone: Review project proposal",
    description: "Complete 3 hours of Learning Spanish",
    startTime: "13:30",
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
    endTime: "19:30",
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

export default async function Dashboard() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (!profile) {
    redirect('/welcome')
  }
  const goalsPromise = getGoals(profile)
  const milestonesPromise = getMilestones(profile)
  const notificationsPromise = getNotifications(profile)
  const [goals, milestones, notifications] = await Promise.all([goalsPromise, milestonesPromise, notificationsPromise])
  return <DashboardClient goals={goals} profile={profile} schedule={schedule} user={user} milestones={milestones} notifications={notifications} />
}
