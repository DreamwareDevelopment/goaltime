import { redirect } from 'next/navigation'
import { getSanitizedUser, getProfile } from '@/server-utils/queries/user'
import SettingsClient from './client'

export default async function SettingsServer() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (!profile) {
    redirect('/welcome')
  }
  return (
    <SettingsClient profile={profile} />
  )
}
