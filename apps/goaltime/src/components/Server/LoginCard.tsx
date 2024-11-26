import Link from 'next/link'

import { UserAuthForm } from '@/ui-components/user-auth-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui-components/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui-components/tabs'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'

interface LoginCardProps extends React.HTMLAttributes<HTMLDivElement> {
  login: (formData: FormData) => Promise<void>
  signup: (formData: FormData) => Promise<void>
}

export default function LoginCard({ login, signup }: LoginCardProps) {
  return (
    <Tabs defaultValue="login" className='flex flex-col w-full h-full gap-4 items-center justify-start pt-16'>
      <TabsList>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card className="mx-auto flex flex-col justify-center space-y-6  max-w-[375px] md:max-w-[400px] lg:max-w-[450px]">
          <CardHeader className="flex flex-col space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Login to your account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your email and password below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <UserAuthForm login={login} />
            </Suspense>
          </CardContent>
          <CardFooter className="px-8 text-center text-sm text-muted-foreground">
            <p>
              By clicking continue, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
      <Card className="mx-auto flex flex-col justify-center space-y-6  max-w-[375px] md:max-w-[400px] lg:max-w-[450px]">
          <CardHeader className="flex flex-col space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Login to your account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your email and password below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <UserAuthForm signup={signup} />
            </Suspense>
          </CardContent>
          <CardFooter className="px-8 text-center text-sm text-muted-foreground">
            <p>
              By clicking continue, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
