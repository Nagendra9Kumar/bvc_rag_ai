'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ErrorBoundary } from 'react-error-boundary'
import { cn } from '@/lib/utils';
import { memo } from 'react'
import { useId } from 'react'

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  delay?: number;
  scaleAmount?: number;
  animationDuration?: number;
  hoverScale?: number;
  tapScale?: number;
  isLoading?: boolean;
  role?: string;
  "aria-label"?: string;
}

export const AnimatedCard = memo(function AnimatedCard({ 
  delay = 0, 
  scaleAmount = 0.98,
  animationDuration = 0.3,
  hoverScale = 1.01,
  tapScale = 0.99,
  isLoading,
  className, 
  children,
  role = "article",
  "aria-label": ariaLabel,
  ...props 
}: AnimatedCardProps) {
  const id = useId();

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)} {...props}>
        <div className="h-full w-full bg-muted/60 rounded-sm min-h-[100px]" />
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={<Card className={className} {...props} />}>
      <motion.div
        initial={{ opacity: 0, scale: scaleAmount }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: animationDuration, 
          ease: [0.23, 1, 0.32, 1],
          delay 
        }}
        whileHover={{ 
          scale: hoverScale,
          transition: { duration: 0.2 } 
        }}
        whileTap={{ 
          scale: tapScale,
          transition: { duration: 0.1 } 
        }}
        className={cn("will-change-transform", "transform-gpu")}
        role={role}
        aria-label={ariaLabel}
        layoutId={`card-${id}-${delay}`} 
        viewport={{ once: true }} 
      >
        <Card className={className} {...props}>
          {children}
        </Card>
      </motion.div>
    </ErrorBoundary>
  )
})