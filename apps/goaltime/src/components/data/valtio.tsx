'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

import { CalendarEvent, Goal, NotificationSettings, UserProfile } from '@prisma/client'
import { SyncEvent } from '@/shared/zod'
import { SanitizedUser } from '@/shared/utils'

import { calendarStore, goalStore, milestoneDynamicStore, userStore } from './proxies'
import { processSyncEvent } from './sync/events'
import { WebSocketClient } from './websocket'
import { WebsocketHandler } from './websocketConsumer'

interface DashboardData {
  goals: Goal[]
  goalAggregates: Record<string, number>
  profile: UserProfile
  user: SanitizedUser
  notifications: NotificationSettings[]
  initialSchedule: CalendarEvent[]
}

export const ValtioContext = createContext<{ calendarStore: typeof calendarStore, userStore: typeof userStore, goalStore: typeof goalStore, milestoneDynamicStore: typeof milestoneDynamicStore, dashboardData: DashboardData | null }>({ calendarStore, userStore, goalStore, milestoneDynamicStore, dashboardData: null })

export function useValtio() {
  return useContext(ValtioContext)
}

export function ValtioProvider({ children, dashboardData }: { children: React.ReactNode, dashboardData: DashboardData }) {
  // Create stores once for the lifetime of the app
  const stores = useRef({ calendarStore, goalStore, userStore, milestoneDynamicStore }).current
  const handler = new WebsocketHandler()
  userStore.init(dashboardData.user, dashboardData.profile, handler);
  goalStore.init(dashboardData.goals, dashboardData.notifications, dashboardData.goalAggregates);
  calendarStore.init(dashboardData.initialSchedule);

  useEffect(() => {
    const client = WebSocketClient.getInstance()

    const connectWebSocket = async () => {
      try {
        await client.init()
        await client.connect({
          onOpen: () => {
            handler.emitOpen()
          },
          onMessage: (event) => {
            const data = JSON.parse(event.data) as SyncEvent
            processSyncEvent(data)
            if (data.calendarEvents?.length) {
              handler.emitCalendarUpdate(data.calendarEvents)
            } else if (data.goals?.length) {
              handler.emitGoalsUpdate(data.goals)
            }
          },
          onError: (error) => {
            handler.emitError(new Error(JSON.stringify(error, null, 2)))
          },
        })
      } catch (error) {
        console.error('WebSocket client failed to connect:', error)
        handler.emitError(error as Error)
      }
    }

    const cleanupWebSocket = () => {
      client.disconnect()
    }

    connectWebSocket().catch((error) => {
      console.error('Invariant: Failed to initialize WebSocket client:', error)
    })

    return cleanupWebSocket
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ValtioContext.Provider value={{ ...stores, dashboardData }}>
      {children}
    </ValtioContext.Provider>
  )
}
