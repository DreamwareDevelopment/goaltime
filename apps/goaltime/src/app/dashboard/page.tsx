import React from 'react'

import { getProfile, getSanitizedUser } from '../queries/user'
import { redirect } from 'next/navigation'
import { getGoals, getMilestones, getNotifications } from '../queries/goal'
import DashboardClient from './client'
import { schedule } from './schedule_dummy_data'


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
  return <DashboardClient goals={goals} profile={profile} schedule={schedule} user={user} milestones={milestones} notifications={notifications} />
}
