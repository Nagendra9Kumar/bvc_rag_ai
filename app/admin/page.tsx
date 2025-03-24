'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Database, Globe, Files, Settings } from 'lucide-react'
import { StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/animations/home-animations'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'

const adminLinks = [
  {
    href: '/admin/documents',
    title: 'Documents',
    description: 'Manage document knowledge base',
    icon: Files,
  },
  {
    href: '/admin/websites',
    title: 'Websites',
    description: 'Manage website knowledge base',
    icon: Globe,
  },
  {
    href: '/admin/databases',
    title: 'Databases',
    description: 'Manage database connections',
    icon: Database,
  },
  {
    href: '/admin/settings',
    title: 'Settings',
    description: 'Configure system settings',
    icon: Settings,
  },
]

export default function AdminPage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your knowledge base and system settings
          </p>
        </div>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2">
          {adminLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <StaggerItem key={link.href}>
                <ScaleOnHover>
                  <AnimatedCard delay={index * 0.1}>
                    <Link href={link.href} className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold">{link.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </AnimatedCard>
                </ScaleOnHover>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </PageLayout>
  )
}
