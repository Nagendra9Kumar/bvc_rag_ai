import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'

export default async function Home() {
  const { userId } = await auth()
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  BVC Engineering College Knowledge Base
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Get instant answers to your questions about BVC Engineering College, Odalarevu.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/chat">Start Chatting</Link>
                </Button>
                {!userId && (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">
                  AI-Powered
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Get Instant Answers
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our AI-powered chatbot provides instant answers to your questions about courses, admissions, faculty, and more.
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">
                  Comprehensive
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Accurate Information
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our knowledge base is built on official college documents and resources, ensuring you get accurate and up-to-date information.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} BVC Engineering College. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
