'use client'

import Link from "next/link";
import { Button as ShinyButton } from "@/ui-components/button-shiny";
import Logo from '@/ui-components/svgs/logos/goaltime'

export function LogoButton() {
  return (
    <Link href="/" className="hidden sm:flex items-center justify-center">
      <Logo className="h-6 w-6" />
      <ShinyButton variant="linkHover2" className="bg-background hover:bg-background/80 text-background-foreground">
        <span className="font-bold">GoalTime</span>
      </ShinyButton>
    </Link>
  )
}
