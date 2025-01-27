'use client'

import type React from "react"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { Button as ShinyButton } from "@/ui-components/button-shiny"
import MobileMenu from "./MobileMenu"
import { usePostHog } from 'posthog-js/react'

interface HeaderProps {
  isLoggedIn: boolean
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const posthog = usePostHog()
  const handleSetGoalsClick = () => {
    posthog.capture(isLoggedIn ? 'set goals clicked' : 'set goals clicked', {
      isLoggedIn: isLoggedIn,
    })
  }

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-black/30 backdrop-blur-lg fixed w-full z-50">
        <Link href="/" className="flex items-center justify-center">
          <Clock className="h-6 w-6" />
          <ShinyButton variant="linkHover2" className="text-background-foreground">
            <span className="font-bold">GoalTime</span>
          </ShinyButton>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <ShinyButton variant="linkHover2" className="hidden md:flex text-background-foreground" asChild>
            <a href="#features">Features</a>
          </ShinyButton>
          <ShinyButton variant="linkHover2" className="hidden md:flex text-background-foreground" asChild>
            <a href="#testimonials">Testimonials</a>
          </ShinyButton>
          <ShinyButton variant="linkHover2" className="hidden md:flex text-background-foreground" asChild>
            <a href="#pricing">Pricing</a>
          </ShinyButton>
          <ShinyButton
            variant="expandIcon"
            Icon={ArrowRight}
            iconPlacement="right"
            asChild
            className="hidden md:flex md:min-w-[178px]"
            onClick={handleSetGoalsClick}
          >
            <Link href={isLoggedIn ? '/dashboard' : '/login?type=signup'}>Set Goals</Link>
          </ShinyButton>
          <MobileMenu isLoggedIn={isLoggedIn} />
        </nav>
      </header>
  )
}

export default Header
