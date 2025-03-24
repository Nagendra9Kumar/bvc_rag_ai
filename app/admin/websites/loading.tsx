'use client'

import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout } from '@/components/client/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WebsitesLoading() {
  return (
    <PageLayout>
      <main className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Website</CardTitle>
            <CardDescription>Add a new college website to scrape content from.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="flex-1 h-11" />
              <Skeleton className="h-11 w-24 sm:w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Websites</CardTitle>
            <CardDescription>List of college websites being tracked.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="flex-1 h-10" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="rounded-md border">
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-6 w-full max-w-md" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageLayout>
  )
}