'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/ui-components/button"
import { Menu, X, Clock } from 'lucide-react'
import Link from 'next/link'

export function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
        <Menu />
        <span className="sr-only">Open menu</span>
      </Button>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background shadow-lg">
            <div className="flex items-center justify-between p-4">
              <a className="flex items-center justify-center" href="#">
                <Clock className="h-6 w-6 mr-2" />
                <span className="font-bold">GoalTime</span>
              </a>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <nav className="flex flex-col gap-4 p-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <Button>
                <Link href="/login?type=signup">Set Goals</Link>
              </Button>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}