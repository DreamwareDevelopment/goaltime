'use client'

import { usePathname, useSearchParams } from "next/navigation"
import posthog from 'posthog-js'
import { usePostHog, PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      return
    }
    const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogApiKey) {
      throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not set')
    }
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!posthogHost) {
      throw new Error('NEXT_PUBLIC_POSTHOG_HOST is not set')
    }
    posthog.init(posthogApiKey, {
      api_host: posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
    })
  }, [])

  if (process.env.NODE_ENV === 'development') {
    return children
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}

function PostHogPageView() : null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      posthog?.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams, posthog])
  
  return null
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
function SuspendedPostHogPageView() {
  return <Suspense fallback={null}>
    <PostHogPageView />
  </Suspense>
}
