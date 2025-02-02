"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    duration?: string
    delay?: number
  }
>(({ className, value, color, duration = '1.5s', delay = 1000, ...props }, ref) => {
  const [transformValue, setTransformValue] = React.useState('translateX(-100%)');

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setTransformValue(`translateX(-${100 - (value || 0)}%)`);
    }, delay); // You can adjust the delay if needed

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1", {
          "bg-primary": !color
        })}
        style={{
          transition: `transform ${duration} ease-out`,
          transform: transformValue,
          backgroundColor: color || undefined
        }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
