'use client'

import Link from "next/link"
import { redirect } from "next/navigation"
import { useState } from "react"
import { User } from "@supabase/supabase-js"

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

export type UserAvatarProps = {
  user: User
}

// TODO: Use zod to validate the user metadata
export type TemporaryUserMetadata = {
  name: string
  email: string
  image: string
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    redirect('/error')
  }
  redirect('/')
}

export function UserAvatar({ user }: UserAvatarProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  console.log(user)
  const metadata: TemporaryUserMetadata = {
    name: user?.user_metadata?.name ?? 'Mike Hawkburns',
    email: user?.email ?? 'mike@hawkburns.com',
    image: user?.user_metadata?.avatar_url ?? 'https://github.com/shadcn.png',
  }
  const { name, email, image } = metadata

  const handleLogout = async () => {
    await signOut()
    console.log("User logged out")
    setIsLogoutDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-11 w-11">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback>{name.split(' ').map(n => n[0].toUpperCase()).join('')}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">Account</Link>
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

