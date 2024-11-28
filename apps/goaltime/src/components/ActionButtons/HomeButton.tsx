'use client'

import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { Home } from "lucide-react"

interface HomeButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  text?: string
  href?: string
}

export function HomeButton({ text = 'Home', href = '/', ...props }: HomeButtonProps) {
  return (
    <ShinyButton variant="expandIcon" Icon={Home} iconPlacement="right" onClick={() => window.location.href = href} {...props}>
      {text}
    </ShinyButton>
  )
}
