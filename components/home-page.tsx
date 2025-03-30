'use client'

import Link from 'next/link'
import { MessageSquare, BookOpen, Brain, ArrowRight } from 'lucide-react'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { GooeyText } from './home/gooey'

const features = [
  {
    title: "Chat with AI",
    description: "Get instant answers to your questions about BVC Engineering College.",
    icon: MessageSquare,
  },
  {
    title: "Comprehensive Knowledge",
    description: "Access detailed information about courses, faculty, and facilities.",
    icon: BookOpen,
  },
  {
    title: "Smart Recommendations",
    description: "Receive personalized suggestions based on your interests.",
    icon: Brain,
  },
]

interface HomePageProps {
  isSignedIn: boolean
}

export function HomePage({ isSignedIn }: HomePageProps) {
  return (
    <PageLayout>
      <section className="container space-y-6 py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-background/60">
        <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
          >
           <div className="flex items-center justify-center">
              <GooeyText
                texts={["BVC","AI", "Assistant"]}
                morphTime={1}
                cooldownTime={0.25}
                className="font-bold"
              />
           </div>
            <br />
            {/* <span className="text-primary">Knowledge Base</span> */}
          </motion.h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Get instant answers about admissions, courses, faculty, campus facilities, and more at BVC Engineering College, Odalarevu.
            No more searching through multiple websites—our AI provides accurate information instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild={true}>
              <Link href="/chat" className="inline-flex items-center gap-2" aria-label="Start chatting with the AI assistant">
                Start Chatting <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            {!isSignedIn && (
              <ButtonWithLoading asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </ButtonWithLoading>
            )}
          </div>
        </div>

        <div className="mx-auto grid justify-center gap-4 px-4 py-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 md:py-12">
          {features.map((feature, index) => (
            <AnimatedCard
              key={feature.title}
              delay={index * 0.2}
              className="h-full"
            >
              <div className="flex h-full flex-col gap-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>

      </section>

      <section className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="text-sm leading-loose text-muted-foreground">
            © {new Date().getFullYear()} BVC Engineering College. All rights reserved.
          </p>
          
        </div>
      </section>
    </PageLayout>
  )
}