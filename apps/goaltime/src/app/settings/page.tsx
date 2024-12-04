import { redirect } from 'next/navigation'
import { getSanitizedUser, getProfile } from '../queries/user'
import SettingsClient from './client'

export default async function SettingsServer() {
  const user = await getSanitizedUser()
  const profile = await getProfile(user.id)
  if (!profile) {
    const error = encodeURIComponent('Profile not found')
    const next = encodeURIComponent('/login')
    const solution = encodeURIComponent('Please log in again.')
    return redirect(`/error?error=${error}&next=${next}&solution=${solution}`)
  }
  return (
    <SettingsClient profile={profile} />
  )
}
