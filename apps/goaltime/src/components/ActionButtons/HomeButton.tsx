'use client'

import { Button as ShinyButton } from "@/ui-components/button-shiny"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface HomeButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  text?: string
  href?: string
}

export function HomeButton({ text = 'Home', href = '/', ...props }: HomeButtonProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.push(href)
  };

  return (
    <ShinyButton variant="expandIcon" Icon={Home} iconPlacement="right" onClick={handleGoHome} {...props}>
      {text}
    </ShinyButton>
  )
}
