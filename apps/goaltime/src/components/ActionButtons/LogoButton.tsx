'use client'

import { Clock } from "lucide-react";
import Link from "next/link";
import { Button as ShinyButton } from "@/ui-components/button-shiny";

export function LogoButton() {
  return (
    <Link href="/" className="hidden sm:flex items-center justify-center">
      <Clock className="h-6 w-6" />
      <ShinyButton variant="linkHover2" className="bg-background hover:bg-background/80 text-background-foreground">
        <span className="font-bold">GoalTime</span>
      </ShinyButton>
    </Link>
  )
}
