import { Metadata } from 'next'

import { Button as ShinyButton } from '@/ui-components/button-shiny'

import { login, signup } from '../actions'
import LoginCard from '../../components/Server/LoginCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
}

export default function LoginPage() {
  return (
    <div className="w-full 2xl:w-[67%] mx-auto p-4 h-screen">
      <header className="flex justify-center items-center mb-6">
        <ShinyButton variant="linkHover2" className="text-2xl font-bold">
          <Link href="/">Goal Time</Link>
        </ShinyButton>
      </header>
      <div className="w-full h-full">
        <LoginCard login={login} signup={signup} />
      </div>
    </div>
  )
}