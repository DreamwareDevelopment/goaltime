'use client'

import { createContext, useContext, useRef } from 'react'

import { goalStore, userStore } from './proxies'

export const ValtioContext = createContext({ userStore, goalStore })

export function useValtio() {
  return useContext(ValtioContext)
}

export function ValtioProvider({ children }: { children: React.ReactNode }) {
  // Create stores once for the lifetime of the app
  const stores = useRef({ goalStore, userStore }).current
  return (
    <ValtioContext.Provider value={stores}>
      {children}
    </ValtioContext.Provider>
  )
}
