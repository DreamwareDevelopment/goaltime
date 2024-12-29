'use client'

import { createContext, useContext, useRef } from 'react'

import { calendarStore, goalStore, milestoneDynamicStore, userStore } from './proxies'
import { Goal, NotificationSettings, UserProfile } from '@prisma/client'
import { SanitizedUser } from '@/server-utils/queries/user'

interface DashboardData {
  goals: Goal[]
  profile: UserProfile
  user: SanitizedUser
  notifications: NotificationSettings[]
}

export const ValtioContext = createContext<{ calendarStore: typeof calendarStore, userStore: typeof userStore, goalStore: typeof goalStore, milestoneDynamicStore: typeof milestoneDynamicStore, dashboardData: DashboardData | null }>({ calendarStore, userStore, goalStore, milestoneDynamicStore, dashboardData: null })

export function useValtio() {
  return useContext(ValtioContext)
}

export function ValtioProvider({ children, dashboardData }: { children: React.ReactNode, dashboardData: DashboardData }) {
  // Create stores once for the lifetime of the app
  const stores = useRef({ calendarStore, goalStore, userStore, milestoneDynamicStore }).current
  userStore.init(dashboardData.user, dashboardData.profile);
  goalStore.init(dashboardData.goals, dashboardData.notifications);

  return (
    <ValtioContext.Provider value={{ ...stores, dashboardData }}>
      {children}
    </ValtioContext.Provider>
  )
}
