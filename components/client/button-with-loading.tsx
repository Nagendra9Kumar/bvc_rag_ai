'use client'

import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'

interface ButtonWithLoadingProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  asChild?: boolean
}

export function ButtonWithLoading({
  isLoading,
  loadingText,
  className,
  children,
  asChild = false,
  ...props
}: ButtonWithLoadingProps) {
  const Comp = asChild ? Slot : Button

  return (
    <Comp
      className={className}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        <span className={isLoading ? 'opacity-70' : ''}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </div>
    </Comp>
  )
}