'use client'

import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  once?: boolean
}

const directionMap = {
  up: { y: (d: number) => d },
  down: { y: (d: number) => -d },
  left: { x: (d: number) => d },
  right: { x: (d: number) => -d },
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
  direction = 'up',
  distance = 20,
  once = true,
}: FadeInProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...Object.fromEntries(
        Object.entries(directionMap[direction]).map(([key, value]) => [
          key,
          value(distance),
        ])
      ),
    },
    visible: {
      opacity: 1,
      ...Object.fromEntries(
        Object.entries(directionMap[direction]).map(([key]) => [key, 0])
      ),
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}