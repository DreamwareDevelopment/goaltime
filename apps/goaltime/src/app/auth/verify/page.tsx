import { MailCheck } from 'lucide-react'
import React from 'react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { resendVerificationAction } from '../../actions/auth'
import { ResendVerificationButton } from '../../../components/Auth/ResendVerificationButton'
import { HomeButton } from '../../../components/ActionButtons/HomeButton'

interface EmailVerificationSentProps {
  searchParams: {
    email: string
  }
}

export default async function EmailVerificationSent({ searchParams }: EmailVerificationSentProps) {
  const email = (await searchParams).email

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>We&apos;ve sent a verification link to your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-center">
              If you don&apos;t see the email in your inbox, please check your spam folder.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-6 px-4 md:w-[70%]">
            <HomeButton text="Go to Homepage" className="w-full" />
            <ResendVerificationButton
              email={email}
              resendVerificationAction={resendVerificationAction}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? <a href="mailto:support@goaltime.ai" className="text-primary hover:underline">Contact support</a>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
