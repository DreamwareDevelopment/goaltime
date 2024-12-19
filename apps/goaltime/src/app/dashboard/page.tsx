import React from 'react'
import { getProfile, getSanitizedUser } from '@/server-utils/queries/user'
import { redirect } from 'next/navigation'
import { getGoals, getMilestones, getNotifications } from '@/server-utils/queries/goal'

import { Card } from "@/ui-components/card"
import { GoalCarousel } from '../../components/GoalCarousel'
import { ScheduleCard } from '../../components/ScheduleCard'
import { GoalProgressCard } from '../../components/GoalProgressCard'
import { GoalyticsCard } from '../../components/GoalyticsCard'
import { ActionsCard } from '../../components/ActionsCard'
import { ValtioProvider } from '../../components/data/valtio'
import { UserAvatar } from '../../components/UserAvatar'
import GoalCreationButton from '../../components/GoalCreationButton'
import { WelcomeCard } from '../../components/WelcomeCard'
import { LogoButton } from '../../components/ActionButtons/LogoButton'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (!profile) {
    redirect('/welcome')
  }

  const [goals, milestones, notifications] = await Promise.all([
    getGoals(profile),
    getMilestones(profile),
    getNotifications(profile)
  ])
  const hasGoals = goals.length > 0;
  return (
    <ValtioProvider 
      dashboardData={{ goals, profile, user, milestones, notifications }}
    >
      <div className="w-full 2xl:w-[67%] mx-auto p-1 pt-4 sm:p-4">
        <header className="flex justify-between items-center mb-5 px-4 sm:px-0">
          <LogoButton />
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
            {hasGoals && <GoalCreationButton />}
          </div>
          <UserAvatar />
        </header>

        { hasGoals ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-7 gap-6">
            <Card className="col-span-1 lg:col-span-2 xl:col-span-4">
              <ScheduleCard />
            </Card>
            <Card className="col-span-1 xl:col-span-3 lg:h-[679px]">
              <GoalProgressCard />
            </Card>
            <Card className="col-span-full overflow-hidden">
              <GoalCarousel />
            </Card>
            <Card className="col-span-full xl:col-span-5">
              <GoalyticsCard />
            </Card>
            <Card className="col-span-1 xl:col-span-2">
              <ActionsCard />
            </Card>
          </div>
        ) : (
          <div className="md:mt-8 lg:mt-12">
            <WelcomeCard />
          </div>
        )}
      </div>
    </ValtioProvider>
  )
}
