import { redirect } from 'next/navigation'

import { createClient } from './client'

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    if (error) {
      console.error(error)
    }
    redirect('/login')
  }

  return data.user
}
