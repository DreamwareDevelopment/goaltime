'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

import { Goal, NotificationSettings, UserProfile } from '@prisma/client'
import { SyncEvent } from '@/shared/zod'
import { SanitizedUser } from '@/shared/utils'
import { useToast } from '@/ui-components/hooks/use-toast'

import { calendarStore, goalStore, milestoneDynamicStore, userStore } from './proxies'
import { processSyncEvent } from './sync/events'
import { WebSocketClient } from './websocket'

interface DashboardData {
  goals: Goal[]
  goalAggregates: Record<string, number>
  profile: UserProfile
  user: SanitizedUser
  notifications: NotificationSettings[]
}

export const ValtioContext = createContext<{ calendarStore: typeof calendarStore, userStore: typeof userStore, goalStore: typeof goalStore, milestoneDynamicStore: typeof milestoneDynamicStore, dashboardData: DashboardData | null }>({ calendarStore, userStore, goalStore, milestoneDynamicStore, dashboardData: null })

export function useValtio() {
  return useContext(ValtioContext)
}

export function ValtioProvider({ children, dashboardData }: { children: React.ReactNode, dashboardData: DashboardData }) {
  const { toast } = useToast()
  const hasShownSyncToast = useRef(false)
  // Create stores once for the lifetime of the app
  const stores = useRef({ calendarStore, goalStore, userStore, milestoneDynamicStore }).current
  userStore.init(dashboardData.user, dashboardData.profile);
  goalStore.init(dashboardData.goals, dashboardData.notifications, dashboardData.goalAggregates);
  
  useEffect(() => {
    const client = WebSocketClient.getInstance()

    const connectWebSocket = async () => {
      try {
        await client.init()
        await client.connect({
          onOpen: () => {
            console.log('WebSocket connection opened')
            if (!hasShownSyncToast.current) {
              toast({
                title: 'Sync is active',
                description: `We'll notify you when we update your schedule`
              })
              hasShownSyncToast.current = true
            }
          },
          onMessage: (event) => {
            console.log('WebSocket message received:', event)
            const data = JSON.parse(event.data) as SyncEvent
            processSyncEvent(data)
            if (data.calendarEvents?.length) {
              toast({
                title: `${data.calendarEvents?.length} events synced`,
                description: 'Your schedule has been updated'
              })
            }
          },
          onError: (error) => {
            console.error('WebSocket error:', error)
            toast({
              title: 'Error during sync',
              description: 'Your changes are safe'
            })
          },
        })
      } catch (error) {
        console.error('WebSocket client failed to connect:', error)
        toast({
          title: 'Sync is stopped',
          description: 'Your changes will still be saved'
        })
        hasShownSyncToast.current = false
      }
    }

    const cleanupWebSocket = () => {
      client.disconnect()
    }

    connectWebSocket().catch((error) => {
      console.error('Invariant: Failed to initialize WebSocket client:', error)
    })

    return cleanupWebSocket
  }, [toast])

  return (
    <ValtioContext.Provider value={{ ...stores, dashboardData }}>
      {children}
    </ValtioContext.Provider>
  )
}
