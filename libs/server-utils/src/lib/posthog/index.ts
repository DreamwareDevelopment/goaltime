import { PostHog } from 'posthog-node'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
if (!posthogKey) {
  throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not set')
}
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
if (!posthogHost) {
  throw new Error('NEXT_PUBLIC_POSTHOG_HOST is not set')
}

export const posthog = new PostHog(posthogKey, {
  host: posthogHost,
})
