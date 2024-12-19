'use client'

import { createContext, useContext, useRef } from 'react'

import { goalStore, userStore } from './proxies'
import { Goal, Milestone, NotificationSettings, UserProfile } from '@prisma/client'
import { SanitizedUser } from '@/server-utils/queries/user'

interface DashboardData {
  goals: Goal[]
  profile: UserProfile
  user: SanitizedUser
  milestones: Milestone[]
  notifications: NotificationSettings[]
}

export const ValtioContext = createContext<{ userStore: typeof userStore, goalStore: typeof goalStore, dashboardData: DashboardData | null }>({ userStore, goalStore, dashboardData: null })

export function useValtio() {
  return useContext(ValtioContext)
}

export function ValtioProvider({ children, dashboardData }: { children: React.ReactNode, dashboardData: DashboardData }) {
  // Create stores once for the lifetime of the app
  const stores = useRef({ goalStore, userStore }).current
  userStore.init(dashboardData.user, dashboardData.profile);
  goalStore.init(dashboardData.goals, dashboardData.milestones, dashboardData.notifications);

  return (
    <ValtioContext.Provider value={{ ...stores, dashboardData }}>
      {children}
    </ValtioContext.Provider>
  )
}
