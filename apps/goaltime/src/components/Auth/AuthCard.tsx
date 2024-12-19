'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import z from 'zod'

import HCaptcha from '@hcaptcha/react-hcaptcha'

import { LoginForm } from './LoginForm'
import { Button as ShinyButton } from '@/ui-components/button-shiny'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui-components/tabs'
import { LoginSchema, SignUpSchema } from '@/shared/zod'
import { SignUpForm } from './SignUpForm'
import { loginWithGoogleAction } from '../../app/actions/auth'
import { GoogleLogo } from '@/ui-components/svgs/logos/google'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui-components/accordion'
import { Separator } from '@/libs/ui-components/src/components/ui/separator'
import { useToast } from '@/libs/ui-components/src/hooks/use-toast'

export type AuthTab = 'login' | 'signup'

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  loginAction: (formData: z.infer<typeof LoginSchema>, captchaToken: string) => Promise<void>
  signupAction: (formData: z.infer<typeof SignUpSchema>, captchaToken: string) => Promise<void>
  type?: AuthTab
  email?: string
}

function OAuthProviders() {
  const { toast } = useToast()
  return (
    <div className="flex flex-col pt-0 gap-4">
      <ShinyButton 
        variant="default"
        className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 border shadow-sm" 
        onClick={() => loginWithGoogleAction().catch((error) => {
          console.error('Error logging in with Google', error)
          toast({
            title: 'Login with Google failed',
            description: error.message,
          })
        })}
      >
        <GoogleLogo className="w-5 h-5" />
        Continue with Google
      </ShinyButton>
      <div className="text-center text-sm text-muted-foreground">
        <p>
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export function AuthCard({ loginAction, signupAction, type, email }: AuthCardProps) {
  const [currentTab, setCurrentTab] = useState<string>(type || 'login')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const captcha = useRef<HCaptcha | null>(null)

  const hCaptchaSiteKey = process.env.NEXT_PUBLIC_H_CAPTCHA_SITE_KEY
  if (!hCaptchaSiteKey) {
    throw new Error('NEXT_PUBLIC_H_CAPTCHA_SITE_KEY is not set')
  }

  const handleSignup = async (formData: z.infer<typeof SignUpSchema>) => {
    if (!captchaToken) {
      throw new Error('Captcha token is required')
    }
    await signupAction(formData, captchaToken)
    if (!captcha.current) {
      console.warn('Captcha ref is not initialized')
    }
    captcha.current?.resetCaptcha()
  }
  const handleLogin = async (formData: z.infer<typeof LoginSchema>) => {
    if (!captchaToken) {
      throw new Error('Captcha token is required')
    }
    try {
      await loginAction(formData, captchaToken)
    } catch (error) {
      console.error('Login card error', error)
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        throw error
      }
    }
    if (!captcha.current) {
      console.warn('Captcha ref is not initialized')
    }
    captcha.current?.resetCaptcha()
  }
  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className='flex flex-col w-full h-full gap-3 items-center justify-start'>
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
          </CardHeader>
          <CardContent className="pb-0">
            <OAuthProviders />
            <Accordion 
              type="single" 
              collapsible 
              className="w-full mt-4"
              onValueChange={(value) => setIsEmailOpen(!!value)}
            >
              <AccordionItem value="email">
                <Separator />
                <AccordionTrigger>Use email instead</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4">
                  <span className="text-sm text-muted-foreground">
                    We will ask you to login to your calendar later.
                  </span>
                  {isEmailOpen && (
                    <div style={{ display: currentTab === 'login' ? 'flex' : 'none' }}>
                      <HCaptcha
                        ref={captcha}
                        sitekey={hCaptchaSiteKey}
                        onVerify={(token) => {
                          setCaptchaToken(token)
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <LoginForm login={handleLogin} email={email} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent forceMount value="signup" hidden={currentTab !== 'signup'}>
        <Card className="mx-auto flex flex-col justify-center space-y-4 max-w-[375px] md:max-w-[400px] lg:max-w-[450px]">
          <CardHeader className="flex flex-col space-y-4 pb-0 text-center items-center justify-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Sign up for an account
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <OAuthProviders />
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="email">
                <Separator />
                <AccordionTrigger>Use email instead</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4">
                  <span className="text-sm text-muted-foreground">We will ask you to login to your calendar later.</span>
                  <div style={{ display: currentTab === 'signup' ? 'flex' : 'none' }}>
                    <HCaptcha
                      ref={captcha}
                      sitekey={hCaptchaSiteKey}
                      onVerify={(token) => {
                        setCaptchaToken(token)
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <SignUpForm signup={handleSignup} email={email} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
