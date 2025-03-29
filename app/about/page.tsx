'use client'

import { StaggerContainer, StaggerItem, Float } from '@/components/animations/home-animations'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'
import { ExternalLink } from 'lucide-react' // Add this import for the external link icon

export default function AboutPage() {
  return (
    <PageLayout>
      <StaggerContainer className="mx-auto max-w-4xl space-y-8 py-5">
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
              <h2 className="text-xl font-semibold">Technology Stack</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                  <h3 className="font-medium">Frontend</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Next.js, TypeScript, TailwindCSS, Shadcn/UI
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                  <h3 className="font-medium">Backend</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Next.js API Routes, Vector Database, RAG Architecture
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center shadow-sm">
                  <h3 className="font-medium">AI/ML</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Advanced Language Models, Embeddings, Semantic Search
                  </p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold">Developer Profile</h2>
              <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 shadow-md">
                    <img 
                      src="https://avatars.githubusercontent.com/u/144660650?v=4" 
                      alt="Nagendra Gubbala"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="mt-4 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium">Nagendra Gubbala</h3>
                  <p className="text-sm text-muted-foreground">Full Stack Developer & ML Engineer</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Experienced developer specializing in AI-powered applications and knowledge management systems.
                    Passionate about creating intuitive, efficient solutions using modern web technologies.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                    <a 
                      href="https://nagendragubbala.me" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Portfolio <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    <a 
                      href="https://github.com/nagendra9kumar" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-3 py-1 text-xs text-white transition-colors hover:bg-zinc-700"
                    >
                      GitHub <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    <a 
                      href="mailto:contact@nagendragubbala.me" 
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/90"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </div>
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
              <div className="mt-4">
                <a 
                  href="/chat" 
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start Chatting
                </a>
              </div>
            </Float>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageLayout>
  )
}
