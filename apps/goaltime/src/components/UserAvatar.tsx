'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/ui-components/avatar"
import { Button } from "@/ui-components/button-shiny"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui-components/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui-components/dialog"
import { createClient } from "@/ui-components/hooks/supabase"
import { LoadingSpinner } from "@/ui-components/svgs/spinner"
import { useAvatarUrl } from "@/ui-components/hooks/avatar-url"
import { useValtio } from "./data/valtio"
import { useSnapshot } from "valtio"
import { usePostHog } from "posthog-js/react"

export function UserAvatar() {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { userStore } = useValtio();
  if (!userStore.profile || !userStore.user) {
    throw new Error('Invariant: User profile not initialized before using UserAvatar')
  }
  const profile = useSnapshot(userStore.profile);
  const posthog = usePostHog()
  useEffect(() => {
    if (posthog) {
      console.log(`Identifying user: ${profile.userId}`)
      posthog?.identify(profile.userId, {
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        plan: profile.plan,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const user = useSnapshot(userStore.user);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    posthog?.reset()
    if (error) {
      router.push('/error')
    }
    router.push('/')
  }

  const [avatarUrl] = useAvatarUrl(profile?.avatarUrl ?? '', supabase)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-11 w-11 hover:h-12 hover:w-12">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.name} />}
              <AvatarFallback>{!profile ? <LoadingSpinner /> : profile?.name.split(' ').map(n => n[0].toUpperCase()).join('')}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button variant="gooeyLeft" className="w-full bg-background text-foreground" onClick={() => router.push('/settings')}>Account</Button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button variant="gooeyLeft" className="w-full bg-background text-foreground" onClick={() => setIsLogoutDialogOpen(true)}>Log out</Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-4">
          <DialogHeader>
            <DialogTitle>Log out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>Log out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

