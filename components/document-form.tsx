'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export function DocumentForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async () => {
    if (!title || !content || !category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to store document')
      }
      
      toast({
        title: 'Document stored',
        description: 'Your document has been stored and indexed successfully',
      })
      
      setTitle('')
      setContent('')
      setCategory('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to store document',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="admission">Admission</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter document content"
          className="min-h-32"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!title || !content || !category || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Document
          </>
        )}
      </Button>
    </div>
  )
}
