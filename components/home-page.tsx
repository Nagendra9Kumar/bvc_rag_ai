'use client'

import Link from 'next/link'
import { MessageSquare, BookOpen, Brain, ArrowRight } from 'lucide-react'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'
import { ButtonWithLoading } from '@/components/client/button-with-loading'

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
      <section className="container space-y-6 py-16 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
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
            <ButtonWithLoading asChild>
              <Link href="/chat" className="inline-flex items-center gap-2">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Link>
            </ButtonWithLoading>
            {!isSignedIn && (
              <ButtonWithLoading asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </ButtonWithLoading>
            )}
          </div>
        </div>

        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {features.map((feature, index) => (
            <AnimatedCard
              key={feature.title}
              delay={index * 0.2}
              className="h-full"
            >
              <div className="flex h-full flex-col gap-2">
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
          <Link 
            href="/about" 
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            About
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}