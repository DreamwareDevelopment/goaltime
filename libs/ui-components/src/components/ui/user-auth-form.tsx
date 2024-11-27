'use client'

import { ArrowRightIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useRef, useState } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha';

import { validateEmail } from '@/shared'

import { cn } from '../../utils'
import { Button as ShinyButton } from './button-shiny'
import { Input } from './input'
import { Label } from './label'
import { LoadingSpinner } from '../../svgs/spinner'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  login?: (formData: FormData) => Promise<void>
  signup?: (
    formData: FormData,
    captchaToken: string,
  ) => Promise<void>
}

export function UserAuthForm({ className, login, signup, ...props }: UserAuthFormProps) {
  const isLogin = login !== undefined && signup === undefined
  const isSignup = signup !== undefined && login === undefined
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const captcha = useRef<HCaptcha | null>(null)
  const hCaptchaSiteKey = process.env.NEXT_PUBLIC_H_CAPTCHA_SITE_KEY
  if (!hCaptchaSiteKey) {
    throw new Error('NEXT_PUBLIC_H_CAPTCHA_SITE_KEY is not set')
  }

  async function onClientSignup(data: FormData) {
    if (!signup) {
      throw new Error('Client signup without server signup is impossible')
    }
    if (!captchaToken) {
      throw new Error('Captcha token is required for client signup')
    }
    console.log('onClientSignup pre signup')
    await signup(data, captchaToken)
    console.log('onClientSignup post signup')
    if (!captcha.current) {
      console.warn('Captcha ref is not initialized')
    }
    captcha.current?.resetCaptcha()
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const email = data.get('email')
    if (!validateEmail(email)) {
      setError('Invalid email address')
      setIsLoading(false)
      return
    }
    const password = data.get('password')
    if (!password) {
      setError('Password is required')
      setIsLoading(false)
      return
    }
    if (isLogin) {
      await login(data).finally(() => setIsLoading(false))
    } else if (isSignup) {
      const confirmPassword = data.get('password-confirm')
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
      await onClientSignup(data).finally(() => setIsLoading(false))
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form action={onSubmit}>
        {isSignup && (
          <HCaptcha
            ref={captcha}
            sitekey={hCaptchaSiteKey}
            onVerify={(token) => {
              setCaptchaToken(token)
            }}
          />
        )}
        <div className="grid gap-2 mt-4">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              name="email"
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
              name="password"
            />
          </div>
          { isSignup && (
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="password-confirm">
                Confirm Password
              </Label>
              <Input
                id="password-confirm"
                placeholder="Confirm Password"
                type="password"
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect="off"
                disabled={isLoading}
                name="password-confirm"
              />
            </div>
          )}
          <ShinyButton variant="expandIcon" Icon={ArrowRightIcon} iconPlacement="right" disabled={isLoading}>
            {isLoading && (
              <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isLogin ? 'Sign In with Email' : 'Sign Up with Email'}
          </ShinyButton>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <ShinyButton variant="expandIcon" Icon={ArrowRightIcon} iconPlacement="right" disabled={isLoading}>
        GitHub
      </ShinyButton>
      {(searchParams?.get('error') || error) && (
        <p className="text-sm text-red-500">{searchParams.get('error') || error}</p>
      )}
    </div>
  )
}

