'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FormLayout } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { useToast } from '@/components/ui/use-toast'
import { Loading } from '@/components/ui/loading'

interface EditDocumentFormProps {
  id: string
}

export function EditDocumentForm({ id }: EditDocumentFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}`)
        if (!response.ok) throw new Error()

        const data = await response.json()
        setTitle(data.title)
        setContent(data.content)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch document',
          variant: 'destructive',
        })
        router.push('/admin/documents')
      } finally {
        setIsFetching(false)
      }
    }

    fetchDocument()
  }, [id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (!response.ok) throw new Error()

      toast({
        title: 'Success',
        description: 'Document updated successfully',
      })

      router.push('/admin/documents')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <Loading size="lg" text="Loading document..." className="py-12" />
  }

  return (
    <FormLayout
      title="Edit Document"
      description="Update document details and content."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Input
            placeholder="Document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Textarea
            placeholder="Document content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            className="min-h-[300px] resize-y"
            required
          />
        </div>
        <div className="flex gap-4 justify-end">
          <ButtonWithLoading
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="h-11 px-8"
          >
            Cancel
          </ButtonWithLoading>
          <ButtonWithLoading
            type="submit"
            isLoading={isLoading}
            loadingText="Saving..."
            disabled={!title.trim() || !content.trim() || isLoading}
            className="h-11 px-8"
          >
            Save Changes
          </ButtonWithLoading>
        </div>
      </form>
    </FormLayout>
  )
}

