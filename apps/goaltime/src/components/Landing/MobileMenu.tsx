'use client'

import React, { useState, useEffect } from 'react'
import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { Menu, X, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Separator } from '@/ui-components/separator'

export function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <>
      <ShinyButton variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
        <Menu />
        <span className="sr-only">Open menu</span>
      </ShinyButton>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background shadow-lg">
            <div className="flex items-center justify-between p-4 pb-0">
              <a className="flex items-center justify-center" href="#">
                <Clock className="h-6 w-6 mr-2" />
                <span className="font-bold">GoalTime</span>
              </a>
              <ShinyButton variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X />
                <span className="sr-only">Close menu</span>
              </ShinyButton>
            </div>
            <nav className="flex flex-col p-4 pt-2">
              <ShinyButton variant="linkHover2" className="py-[40px]" onClick={() => {
                setMobileMenuOpen(false)
                router.push('/#features')
              }}>
                Features
              </ShinyButton>
              <Separator />
              <ShinyButton variant="linkHover2" className="py-[40px]" onClick={() => {
                setMobileMenuOpen(false)
                router.push('/#testimonials')
              }}>
                Testimonials
              </ShinyButton>
              <Separator />
              <ShinyButton variant="linkHover2" className="py-[40px]" onClick={() => {
                setMobileMenuOpen(false)
                router.push('/#pricing')
              }}>
                Pricing
              </ShinyButton>
              <Separator/>
              <ShinyButton className="mt-[32px]" variant="expandIcon" Icon={ArrowRight} iconPlacement="right" onClick={() => {
                setMobileMenuOpen(false)
                router.push('/login?type=signup')
              }}>
                Set Goals
              </ShinyButton>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}