'use client'

import { RefreshCw } from 'lucide-react'
import React from 'react'

import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { useToast } from "@/ui-components/hooks/use-toast"

interface ResendVerificationButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  email: string
  resendVerificationAction: (email: string) => Promise<void>
}

export function ResendVerificationButton({ email, resendVerificationAction, ...props }: ResendVerificationButtonProps) {
  const { toast } = useToast()

  const handleClick = () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'No email provided',
      })
      return
    }
    resendVerificationAction(email)
      .then(() =>
        toast({
          title: 'Verification email sent',
        }),
      )
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Error sending verification email',
          description: error.message,
        })
      })
  }

  return (
    <ShinyButton variant="expandIcon" Icon={RefreshCw} iconPlacement="right" onClick={handleClick} {...props}>
      Resend email
    </ShinyButton>
  )
}
