'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Database, Globe, Files, Settings, Search } from 'lucide-react'
import { StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/animations/home-animations'
import { PageLayout } from '@/components/client/page-layout'
import { AnimatedCard } from '@/components/client/animated-card'
import { useState, useEffect } from 'react'

type AdminLinkType = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminLinks: AdminLinkType[] = [
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

const AdminLink = ({ link, index }: { link: AdminLinkType; index: number }) => {
  const Icon = link.icon
  
  return (
    <StaggerItem>
      <ScaleOnHover>
        <AnimatedCard delay={index * 0.1}>
          <Link 
            href={link.href} 
            className="block p-4 sm:p-6 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 h-full"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = link.href
              }
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base">{link.title}</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        </AnimatedCard>
      </ScaleOnHover>
    </StaggerItem>
  )
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const filteredLinks = adminLinks.filter(link => 
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6 p-4 sm:p-6 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
            <div className="h-10 w-full max-w-lg bg-gray-200 rounded" />
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Manage your knowledge base and system settings
          </p>
        </div>
        
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md pl-9 pr-4 py-2 border text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <StaggerContainer className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLinks.map((link, index) => (
            <AdminLink key={link.href} link={link} index={index} />
          ))}
        </StaggerContainer>
      </div>
    </PageLayout>
  )
}
