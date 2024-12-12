'use client'

import { Clock } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic'

import { CalendarEvent } from "../../components/ScheduleCard";
import { GoalCreationButton } from "../../components/GoalCreationButton";
import { UserAvatar } from "../../components/UserAvatar";
import { useValtio } from "../../components/data/valtio";
import { Goal, NotificationSettings, Milestone, UserProfile } from "@/shared/models";
import { SanitizedUser } from "../queries/user";
import { useSnapshot } from "valtio";
import { Button as ShinyButton } from "@/ui-components/button-shiny";

const ActionsCard = dynamic(() => import('../../components/ActionsCard.tsx').then(mod => mod.ActionsCard))
const GoalCarousel = dynamic(() => import('../../components/GoalCarousel.tsx').then(mod => mod.GoalCarousel))
const GoalyticsCard = dynamic(() => import('../../components/GoalyticsCard.tsx').then(mod => mod.GoalyticsCard))
const GoalProgressCard = dynamic(() => import('../../components/GoalProgressCard.tsx').then(mod => mod.GoalProgressCard))
const ScheduleCard = dynamic(() => import('../../components/ScheduleCard.tsx').then(mod => mod.ScheduleCard))
const WelcomeCard = dynamic(() => import('../../components/WelcomeCard.tsx').then(mod => mod.WelcomeCard))

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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const localGoals = useSnapshot(goalStore.goals!)
  const hasGoals = localGoals.length > 0;
  return (
    <div className="w-full 2xl:w-[67%] mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <Link href="/" className="hidden md:flex items-center justify-center">
          <Clock className="h-6 w-6" />
          <ShinyButton variant="linkHover2" className="bg-background hover:bg-background/80 text-background-foreground">
            <span className="font-bold">GoalTime</span>
          </ShinyButton>
        </Link>
        {hasGoals && <GoalCreationButton />}
        <UserAvatar />
      </header>

      {hasGoals ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalProgressCard />
            <ScheduleCard schedule={schedule} />
            <GoalCarousel className="lg:col-span-2 overflow-hidden" />
          </div>
          <div className="flex justify-center py-10">
            <GoalCreationButton className="md:min-w-[333px]" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <GoalyticsCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <ActionsCard className="col-span-1" />
          </div>
        </>
      ) : (
        <div className="md:mt-8 lg:mt-12">
          <WelcomeCard />
        </div>
      )}
    </div>
  )
}
