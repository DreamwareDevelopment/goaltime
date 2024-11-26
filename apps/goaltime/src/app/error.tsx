'use client'
 
import { Button } from '@/ui-components/button-shiny'
import { ArrowLeftIcon } from 'lucide-react'
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error?: Error & { digest?: string }
  reset?: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <h2 className="text-2xl font-bold text-destructive text-center">Something went wrong!</h2>
      <Button
        variant="expandIcon"
        Icon={ArrowLeftIcon}
        iconPlacement="left"
        className="mt-4"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => {
            if (reset) reset()
          }
        }
      >
        Try again
      </Button>
    </div>
  )
}