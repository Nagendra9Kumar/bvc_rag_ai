'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '../../components/animations/fade-in'
import { School, BookOpen, Users, AwardIcon } from 'lucide-react'

const features = [
  {
    icon: School,
    title: "Premier Institution",
    description: "Established in 2009, BVC Engineering College has grown to become one of the leading engineering institutions in Andhra Pradesh."
  },
  {
    icon: BookOpen,
    title: "Academic Excellence",
    description: "Offering a wide range of engineering programs with state-of-the-art facilities and experienced faculty."
  },
  {
    icon: Users,
    title: "Strong Community",
    description: "A vibrant community of students, faculty, and alumni working together to achieve excellence."
  },
  {
    icon: AwardIcon,
    title: "Achievements",
    description: "Recognized for academic excellence and innovative research contributions in various fields."
  }
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center"
          >
            <h1 className="font-heading text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              About Us
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              BVC Engineering College is committed to providing quality education and fostering innovation
              in engineering and technology.
            </p>
          </motion.div>
        </section>

        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-4">
            {features.map((feature, index) => (
              <FadeIn key={feature.title} delay={index * 0.2}>
                <Card className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-[58rem] text-center">
              <h2 className="font-heading text-3xl font-bold leading-[1.1] sm:text-3xl md:text-4xl">
                Connect With Us
              </h2>
              <p className="mt-4 text-muted-foreground">
                Visit us at BVC Engineering College, Odalarevu, Andhra Pradesh, India.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} BVC Engineering College. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
