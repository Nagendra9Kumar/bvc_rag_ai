import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { BookOpen, Brain, MessageSquare } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { FadeIn } from '@/components/animations/fade-in'
import { HomeContent } from '@/components/animations/home-animations'

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

export default async function Home() {
  const { userId } = await auth()
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="container space-y-6 py-16 md:py-24 lg:py-32">
          <HomeContent userId={userId} />
        </section>

        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            {features.map((feature, index) => (
              <FadeIn key={feature.title} delay={index * 0.2}>
                <div className="relative overflow-hidden rounded-lg border bg-background p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} BVC Engineering College. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Link 
              href="/about" 
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
