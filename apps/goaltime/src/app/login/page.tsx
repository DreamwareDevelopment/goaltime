import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Button as ShinyButton } from '@/ui-components/button-shiny'

import { loginAction, signupAction } from '../actions/auth'
import { AuthCard, AuthTab } from '../../components/Auth/AuthCard'
import Link from 'next/link'
import { Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
}

interface LoginPageProps {
  searchParams: Promise<{
    type?: string
    email?: string
  }>
}

function validateType(type: string | undefined) {
  if (type && type !== 'login' && type !== 'signup') {
    const message = encodeURIComponent('Invalid login type')
    const solution = encodeURIComponent('Please go to the login page.')
    const next = encodeURIComponent('/login')
    // TODO: Use a helper function to redirect to the error page to get type safety
    return redirect(`/error?error=${message}&next=${next}&solution=${solution}`)
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { type, email } = await searchParams
  validateType(type)

  return (
    <div className="w-full 2xl:w-[67%] mx-auto p-4 h-screen">
      <header className="flex justify-center items-center my-6 md:my-14 lg:mt-16 lg:mb-20">
        <Link href="/" className="hidden md:flex items-center justify-center">
          <Clock className="h-6 w-6" />
          <ShinyButton variant="linkHover2" className="bg-background hover:bg-background/80 text-background-foreground">
            <span className="font-bold text-lg md:text-xl lg:text-2xl">GoalTime</span>
          </ShinyButton>
        </Link>
      </header>
      <div className="w-full h-full">
        <AuthCard
          loginAction={loginAction}
          signupAction={signupAction}
          type={type as AuthTab}
          email={email}
        />
      </div>
    </div>
  )
}