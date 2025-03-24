'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export function Loading({ 
  className, 
  size = 'default',
  text,
  fullScreen = false
}: LoadingProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'flex flex-col items-center justify-center gap-3',
          fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
          className
        )}
      >
        <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size])} />
        {text && (
          <p className={cn(
            'text-muted-foreground animate-pulse',
            size === 'sm' && 'text-xs',
            size === 'default' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}>
            {text}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}