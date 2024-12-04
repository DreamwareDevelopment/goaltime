import { useEffect, useState } from "react"
import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "./supabase"

export function useAvatarUrl(avatarUrl: string, supabase?: SupabaseClient): [string | null, (url: string) => void] {
  if (!supabase) {
    supabase = createClient()
  }
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)

  useEffect(() => {
    const fetchAvatar = async () => {
      if (avatarUrl) {
        try {
          console.log('avatarUrl', avatarUrl)
          if (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob')) {
            setAvatarSrc(avatarUrl)
          } else {
            const { data, error } = await supabase.storage.from('profile_images').download(avatarUrl)
            if (error) {
              console.error('Error fetching avatar from supabase:', error)
            } else {
              setAvatarSrc(URL.createObjectURL(data))
            }
          }
        } catch (error) {
          console.error('Error fetching avatar:', error)
        }
      }
    }
    fetchAvatar()
    return () => {
      if (avatarSrc) {
        URL.revokeObjectURL(avatarSrc)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [avatarSrc, setAvatarSrc]
}
