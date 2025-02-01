"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu } from "lucide-react"
import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { Sheet, SheetContent, SheetTrigger } from "@/ui-components/sheet"
import { Separator } from "@/ui-components/separator"
import Logo from '@/ui-components/svgs/logos/goaltime'
import { DialogTitle, DialogDescription } from "@/ui-components/dialog"

export interface MobileMenuProps {
  isLoggedIn: boolean
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isLoggedIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <ShinyButton variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
        </ShinyButton>
      </SheetTrigger>
      <SheetContent>
        <DialogTitle className="sr-only">GoalTime Mobile Menu</DialogTitle>
        <DialogDescription className="sr-only">Navigate through the menu options to explore features, testimonials, pricing, and set goals.</DialogDescription>
        <div className="flex flex-col space-y-4">
          <Link href="/" className="flex items-center justify-center">
            <Logo className="h-6 w-6" />
            <ShinyButton variant="linkHover2" className="bg-background hover:bg-background/80 text-background-foreground" onClick={handleLinkClick}>
              <span className="font-bold">GoalTime</span>
            </ShinyButton>
          </Link>
          <Separator />
          <Link href="#features" className="text-lg font-medium">
            <ShinyButton variant="linkHover2" onClick={handleLinkClick}>
              Features
            </ShinyButton>
          </Link>
          <Separator />
          <Link href="#testimonials" className="text-lg font-medium">
            <ShinyButton variant="linkHover2" onClick={handleLinkClick}>
                Testimonials
            </ShinyButton>
          </Link>
          <Separator />
          <Link href="#pricing" className="text-lg font-medium">
            <ShinyButton variant="linkHover2" onClick={handleLinkClick}>
              Pricing
            </ShinyButton>
          </Link>
          <Separator />
          <Link href={isLoggedIn ? '/dashboard' : '/login?type=signup'} className="text-lg font-medium w-full">
            <ShinyButton className="mt-[32px] w-full" variant="expandIcon" Icon={ArrowRight} iconPlacement="right" onClick={handleLinkClick}>
              Set Goals
            </ShinyButton>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu
