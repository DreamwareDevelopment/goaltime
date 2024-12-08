'use client'

import { ActionsCard } from "../../components/ActionsCard";
import { GoalCarousel } from "../../components/GoalCarousel";
import { GoalyticsCard } from "../../components/GoalyticsCard";
import { GoalCreationButton } from "../../components/GoalCreationButton";
import { GoalProgressCard } from "../../components/GoalProgressCard";
import { CalendarEvent, ScheduleCard } from "../../components/ScheduleCard";
import { UserAvatar } from "../../components/UserAvatar";
import { useValtio } from "../../components/data/valtio";
import { Goal, NotificationSettings, Milestone, UserProfile } from "@/shared/models";
import { SanitizedUser } from "../queries/user";

export interface DashboardClientProps {
  goals: Goal[]
  profile: UserProfile
  schedule: CalendarEvent[]
  user: SanitizedUser
  milestones: Milestone[]
  notifications: NotificationSettings[]
}

export default function DashboardClient({ goals, profile, schedule, user, milestones, notifications }: DashboardClientProps) {
  const { userStore, goalStore } = useValtio();
  userStore.init(user, profile);
  goalStore.init(goals, milestones, notifications);
  return (
    <div className="w-full 2xl:w-[67%] mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goal Time</h1>
        <GoalCreationButton />
        <UserAvatar />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleCard schedule={schedule} />
        <GoalProgressCard />
        <GoalCarousel className="lg:col-span-2 overflow-hidden" />
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <GoalyticsCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <ActionsCard className="col-span-1" />
      </div>
    </div>
  )
}