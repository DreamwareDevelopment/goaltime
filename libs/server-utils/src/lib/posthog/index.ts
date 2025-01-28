import { PostHog } from 'posthog-node'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

export const posthog = posthogKey && posthogHost ? new PostHog(posthogKey, {
  host: posthogHost,
}) : undefined
