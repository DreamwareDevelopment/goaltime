'use client'

import type React from "react"
import { ArrowRight, Play } from "lucide-react"
import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { usePostHog } from 'posthog-js/react'

interface HeroSectionProps {
  isLoggedIn: boolean
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
  const posthog = usePostHog()
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
              onClick={() => {
                posthog?.capture(isLoggedIn ? 'start free trial clicked' : 'start free trial clicked', {
                  isLoggedIn: isLoggedIn,
                })
                if (isLoggedIn) {
                  window.location.href = '/dashboard'
                } else {
                  window.location.href = '/login?type=signup'
                }
              }}
            >
              Start Free Trial
            </ShinyButton>
            <ShinyButton
              variant="expandIcon"
              Icon={Play}
              iconPlacement="right"
              className="bg-accent hover:bg-accent/80 text-accent-foreground h-[36px] sm:h-[53px]"
              onClick={() => {
                posthog?.capture('watch demo clicked')
                window.open('https://youtu.be/qvuq7BZDM1w', '_blank')
              }}
            >
              Watch Demo
            </ShinyButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection




