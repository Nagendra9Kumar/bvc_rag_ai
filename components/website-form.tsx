'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export function WebsiteForm() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add website')
      }

      toast({
        title: 'Success',
        description: 'Website added successfully',
      })

      setUrl('')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add website',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3"
    >
      <div className="flex-1">
        <Input
          type="url"
          placeholder="Enter website URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="h-11 transition-shadow focus-visible:ring-2"
          required
        />
      </div>
      <ButtonWithLoading
        type="submit"
        isLoading={isLoading}
        loadingText="Adding..."
        disabled={!url.trim() || isLoading}
        className="h-11 px-8 transition-all duration-200 active:scale-95"
      >
        Add Website
      </ButtonWithLoading>
    </motion.form>
  )
}