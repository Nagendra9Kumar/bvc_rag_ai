'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/file-upload'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { FormLayout } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loading } from '@/components/ui/loading'

export function DocumentForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (!response.ok) throw new Error()

      toast({
        title: 'Success',
        description: 'Document added successfully',
      })

      setTitle('')
      setContent('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add document',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadComplete = (result: { content: string }) => {
    setContent(result.content)
    setIsUploading(false)
  }

  return (
    <FormLayout
      title="Add New Document"
      description="Add a new document to the knowledge base."
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
            className="min-h-[200px] resize-y"
            required
          />
        </div>
        <div className="space-y-4">
          <FileUpload
            onUploadStart={() => setIsUploading(true)}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              setIsUploading(false)
              toast({
                title: 'Error',
                description: error,
                variant: 'destructive',
              })
            }}
          />
          {isUploading && (
            <Loading size="sm" text="Processing document..." className="py-2" />
          )}
        </div>
        <div className="flex justify-end">
          <ButtonWithLoading
            type="submit"
            isLoading={isLoading}
            loadingText="Adding..."
            disabled={!title.trim() || !content.trim() || isLoading || isUploading}
            className="h-11 px-8"
          >
            Add Document
          </ButtonWithLoading>
        </div>
      </form>
    </FormLayout>
  )
}
