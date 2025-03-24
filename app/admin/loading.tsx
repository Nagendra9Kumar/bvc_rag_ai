'use client'

import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout } from '@/components/client/page-layout'

export default function AdminLoading() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="mt-2 h-4 w-[300px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-lg border p-4"
            >
              <div className="space-y-3">
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-12 w-[180px]" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}