'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <div 
        className="pointer-events-none fixed inset-0 select-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]"
        aria-hidden="true"
      />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1]
        }}
        className="relative"
      >
        {children}
      </motion.main>
      <div 
        className="pointer-events-none fixed inset-0 select-none bg-gradient-to-tr from-background/0 via-background/50 to-background/0 dark:from-background/0 dark:via-background/50 dark:to-background/0"
        aria-hidden="true"
      />
    </div>
  )
}