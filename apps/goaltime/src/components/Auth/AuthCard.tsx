'use client'

import Link from 'next/link'
import { Suspense, useRef, useState } from 'react'
import z from 'zod'

import HCaptcha from '@hcaptcha/react-hcaptcha'

import { LoginForm } from './LoginForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui-components/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui-components/tabs'
import { LoadingSpinner } from '@/libs/ui-components/src/svgs/spinner'
import { LoginSchema, SignUpSchema } from '@/libs/shared/src/lib/schemas'
import { SignUpForm } from './SignUpForm'

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  loginAction: (formData: z.infer<typeof LoginSchema>, captchaToken: string) => Promise<void>
  signupAction: (formData: z.infer<typeof SignUpSchema>, captchaToken: string) => Promise<void>
}

export function AuthCard({ loginAction, signupAction }: AuthCardProps) {
  const [currentTab, setCurrentTab] = useState<string>('login')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<HCaptcha | null>(null)

  const hCaptchaSiteKey = process.env.NEXT_PUBLIC_H_CAPTCHA_SITE_KEY
  if (!hCaptchaSiteKey) {
    throw new Error('NEXT_PUBLIC_H_CAPTCHA_SITE_KEY is not set')
  }

  const handleSignup = async (formData: z.infer<typeof SignUpSchema>) => {
    if (!captchaToken) {
      throw new Error('Captcha token is required for client signup')
    }
    await signupAction(formData, captchaToken)
    if (!captcha.current) {
      console.warn('Captcha ref is not initialized')
    }
    captcha.current?.resetCaptcha()
  }
  const handleLogin = async (formData: z.infer<typeof LoginSchema>) => {
    if (!captchaToken) {
      throw new Error('Captcha token is required for client signup')
    }
    await loginAction(formData, captchaToken)
    if (!captcha.current) {
      console.warn('Captcha ref is not initialized')
    }
    captcha.current?.resetCaptcha()
  }
  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className='flex flex-col w-full h-full gap-3 items-center justify-start pt-12'>
      <TabsList>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Signup</TabsTrigger>
      </TabsList>
      <TabsContent forceMount value="login" hidden={currentTab !== 'login'}>
        <Card className="mx-auto flex flex-col justify-center space-y-4 max-w-[375px] md:max-w-[400px] lg:max-w-[450px]">
          <CardHeader className="flex flex-col space-y-4 pb-0 text-center items-center justify-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Login to your account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your email and password below to login to your account
            </CardDescription>
            <div style={{ display: currentTab === 'login' ? 'flex' : 'none' }}>
              <HCaptcha
                ref={captcha}
                sitekey={hCaptchaSiteKey}
                onVerify={(token) => {
                  setCaptchaToken(token)
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <LoginForm login={handleLogin} />
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
      <TabsContent forceMount value="signup" hidden={currentTab !== 'signup'}>
        <Card className="mx-auto flex flex-col justify-center space-y-4 max-w-[375px] md:max-w-[400px] lg:max-w-[450px]">
          <CardHeader className="flex flex-col space-y-4 pb-0 text-center items-center justify-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Sign up for an account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your email and password below to sign up for an account
            </CardDescription>
            <div style={{ display: currentTab === 'signup' ? 'flex' : 'none' }}>
              <HCaptcha
                ref={captcha}
                sitekey={hCaptchaSiteKey}
                onVerify={(token) => {
                  setCaptchaToken(token)
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <SignUpForm signup={handleSignup} />
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
