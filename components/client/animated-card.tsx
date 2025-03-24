'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  delay?: number
}

export function AnimatedCard({ delay = 0, className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.23, 1, 0.32, 1],
        delay 
      }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ 
        scale: 0.99,
        transition: { duration: 0.1 } 
      }}
    >
      <Card className={className} {...props} />
    </motion.div>
  )
}