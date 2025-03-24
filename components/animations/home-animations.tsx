'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HomeAnimationsProps {
  userId?: string | null
}

export function HomeContent({ userId }: HomeAnimationsProps) {
  return (
    <>
      <motion.div 
        className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          BVC Engineering College
          <br />
          <span className="text-primary">Knowledge Base</span>
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Get instant answers to your questions about BVC Engineering College, Odalarevu.
          Powered by advanced AI for accurate and relevant information.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild size="lg" className="gap-2">
              <Link href="/chat">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          {!userId && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}