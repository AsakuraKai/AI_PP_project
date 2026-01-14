"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-zinc-700",
      "hover:data-[state=checked]:bg-blue-500 hover:data-[state=unchecked]:bg-zinc-600",
      "hover:scale-105 active:scale-95",
      "data-[state=checked]:shadow-blue-500/20 data-[state=checked]:shadow-lg",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0",
        "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "data-[state=checked]:scale-110 data-[state=unchecked]:scale-100"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
