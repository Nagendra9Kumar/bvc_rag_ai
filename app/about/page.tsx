'use client'

import { StaggerContainer, StaggerItem, Float } from '@/components/animations/home-animations'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'

export default function AboutPage() {
  return (
    <PageLayout>
      <StaggerContainer className="mx-auto max-w-4xl space-y-8">
        <StaggerItem>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              About BVC Knowledge Base
            </h1>
            <p className="text-lg text-muted-foreground">
              Learn more about our AI-powered knowledge base system
            </p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold">Our Mission</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                BVC Knowledge Base aims to make information about BVC Engineering College easily accessible to students, 
                faculty, and visitors. We leverage advanced AI technology to provide accurate and relevant answers to 
                your questions instantly.
              </p>
            </div>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold">How It Works</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">1. Ask Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Simply type your question about BVC Engineering College in natural language
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">2. Get Instant Answers</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI processes your question and provides relevant information from our knowledge base
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">3. Continuous Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    The system learns and improves from user interactions and feedback
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">4. Up-to-date Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Our knowledge base is regularly updated with the latest information
                  </p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold">Technology</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Built with cutting-edge technology including Next.js, TypeScript, and advanced language models, 
                our system ensures fast, reliable, and accurate responses to your queries.
              </p>
            </div>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-lg bg-muted p-6 text-center">
            <Float>
              <h2 className="text-xl font-semibold">Have Questions?</h2>
              <p className="mt-2 text-muted-foreground">
                Try our chat interface to get instant answers about BVC Engineering College
              </p>
            </Float>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageLayout>
  )
}
