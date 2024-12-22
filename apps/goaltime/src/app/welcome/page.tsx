import { redirect } from 'next/navigation'

import { getSanitizedUser, getProfile } from '@/server-utils/queries/user'
import { Card } from '@/ui-components/card'

import WelcomeFlowClient from './client'
import { ScrollArea } from '@/libs/ui-components/src/components/ui/scroll-area'

export default async function WelcomeFlowServer() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (profile) {
    const error = 'Profile already exists during welcome flow'
    console.error(error)
    const next = encodeURIComponent('/dashboard')
    redirect(`/error?error=${error}&next=${next}&solution=Please go to the dashboard.`)
  }
  return (
    <div className="h-screen flex items-center justify-center">
      <ScrollArea className="h-full w-full">
        <Card className="w-full py-4 max-w-lg mx-auto">
          <WelcomeFlowClient userId={user.id} />
        </Card>
      </ScrollArea>
    </div>
  )
}