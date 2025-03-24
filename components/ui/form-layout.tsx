'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FormLayoutProps extends Omit<HTMLMotionProps<'div'>, 'title' | 'children'> {
  title?: string
  description?: string
  footer?: React.ReactNode
  children?: React.ReactNode
}

export function FormLayout({
  title,
  description,
  footer,
  children,
  className,
  ...props
}: FormLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'bg-card rounded-xl border shadow-sm p-6 md:p-8',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-6 space-y-1">
          {title && (
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-6">{children}</div>
      {footer && (
        <div className="mt-6 flex items-center justify-end gap-4">
          {footer}
        </div>
      )}
    </motion.div>
  )
}