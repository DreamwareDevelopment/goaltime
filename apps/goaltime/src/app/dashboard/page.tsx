import React from 'react'

import { getProfile, getSanitizedUser } from '@/server-utils/queries/user'
import { redirect } from 'next/navigation'
import { getGoals, getMilestones, getNotifications } from '@/server-utils/queries/goal'
import DashboardClient from './client'


export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (!profile) {
    redirect('/welcome')
  }
  const goalsPromise = getGoals(profile)
  // TODO: Only fetch the milestones and notifications for the first goal
  // Then use lazy loading to fetch the rest. This will require ts-rest.
  const milestonesPromise = getMilestones(profile)
  const notificationsPromise = getNotifications(profile)
  const [goals, milestones, notifications] = await Promise.all([goalsPromise, milestonesPromise, notificationsPromise])
  return <DashboardClient goals={goals} profile={profile} user={user} milestones={milestones} notifications={notifications} />
}
