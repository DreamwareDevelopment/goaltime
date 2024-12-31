'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

import { calendarStore, goalStore, milestoneDynamicStore, userStore } from './proxies'
import { Goal, NotificationSettings, UserProfile } from '@prisma/client'
import { SanitizedUser } from '@/server-utils/queries/user'
import { WebSocketClient } from './websocket'
import { useToast } from '@/libs/ui-components/src/hooks/use-toast'

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
  const { toast } = useToast()
  const hasShownSyncToast = useRef(false)
  // Create stores once for the lifetime of the app
  const stores = useRef({ calendarStore, goalStore, userStore, milestoneDynamicStore }).current
  userStore.init(dashboardData.user, dashboardData.profile);
  goalStore.init(dashboardData.goals, dashboardData.notifications);
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ValtioContext.Provider value={{ ...stores, dashboardData }}>
      {children}
    </ValtioContext.Provider>
  )
}
