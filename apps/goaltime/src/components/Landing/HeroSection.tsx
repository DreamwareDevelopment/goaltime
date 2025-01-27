'use client'

import type React from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button as ShinyButton } from "@/ui-components/button-shiny"
import posthog from "posthog-js"

interface HeroSectionProps {
  isLoggedIn: boolean
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 xl:py-48 relative">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col justify-center items-center gap-6 text-center">
          <div className="flex flex-col justify-center gap-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Achieve Your Goals with GoalTime
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              AI Accountability Coach
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <ShinyButton
              className="h-[34px] sm:h-[51px]"
              variant="expandIcon"
              Icon={ArrowRight}
              iconPlacement="right"
              asChild
              onClick={() => posthog.capture(isLoggedIn ? 'start free trial clicked' : 'start free trial clicked', {
                isLoggedIn: isLoggedIn,
              })}
            >
              <Link href={isLoggedIn ? '/dashboard' : '/login?type=signup'}>Start Free Trial</Link>
            </ShinyButton>
            <ShinyButton
              variant="expandIcon"
              Icon={Play}
              iconPlacement="right"
              asChild
              className="bg-accent hover:bg-accent/80 text-accent-foreground h-[36px] sm:h-[53px]"
              onClick={() => posthog.capture('watch demo clicked')}
            >
              <Link href="/demo">Watch Demo</Link>
            </ShinyButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection




