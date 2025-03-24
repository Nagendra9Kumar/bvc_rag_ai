'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  },
}

interface HomeAnimationsProps {
  userId?: string | null
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function StaggerContainer({ children, className, delay = 0 }: StaggerContainerProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

const directionMap = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
}

export function FadeIn({ children, className, delay = 0, direction = 'up' }: FadeInProps) {
  const initial = { opacity: 0, ...directionMap[direction] }
  
  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FloatProps {
  children: React.ReactNode
  className?: string
  duration?: number
  distance?: number
}

export function Float({
  children,
  className,
  duration = 4,
  distance = 20,
}: FloatProps) {
  return (
    <motion.div
      animate={{
        y: [-distance/2, distance/2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}

interface ScaleOnHoverProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function ScaleOnHover({
  children,
  className,
  scale = 1.05,
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}

interface ParallaxProps {
  children: React.ReactNode
  className?: string
  speed?: number
}

export function Parallax({
  children,
  className,
  speed = 0.5,
}: ParallaxProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      style={{
        y: speed < 0
          ? `calc(${-speed * 100}% - ${-speed * 100}vh)`
          : 'calc(0px)',
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}

export function HomeContent({ userId }: HomeAnimationsProps) {
  return (
    <>
      <StaggerContainer 
        className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center"
      >
        <StaggerItem>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            BVC Engineering College
            <br />
            <span className="text-primary">Knowledge Base</span>
          </h1>
        </StaggerItem>
        <StaggerItem>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Get instant answers to your questions about BVC Engineering College, Odalarevu.
            Powered by advanced AI for accurate and relevant information.
          </p>
        </StaggerItem>
        <StaggerItem>
          <div className="flex flex-wrap justify-center gap-4">
            <ScaleOnHover>
              <Button asChild size="lg" className="gap-2">
                <Link href="/chat">
                  Start Chatting <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </ScaleOnHover>
            {!userId && (
              <ScaleOnHover>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </ScaleOnHover>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </>
  )
}