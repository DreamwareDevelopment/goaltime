'use client'

import Link from "next/link"
import { redirect } from "next/navigation"
import { useState } from "react"

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
import { UserProfile } from "@/shared/models"
import { SanitizedUser } from "../app/queries/user"

export type UserAvatarProps = {
  user: SanitizedUser
  profile: UserProfile | null
}

export function UserAvatar({ user, profile }: UserAvatarProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      redirect('/error')
    }
    redirect('/')
  }

  const [avatarUrl] = useAvatarUrl(profile?.avatarUrl ?? '', supabase)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-11 w-11">
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
            <Link href="/settings">Account</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsLogoutDialogOpen(true)}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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

