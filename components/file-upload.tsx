'use client'

import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const handleUpload = async () => {
    if (!file || !title || !category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('category', category)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload file')
      }
      
      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded and processed successfully',
      })
      
      setFile(null)
      setTitle('')
      setCategory('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
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
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx"
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            Selected file: {file.name}
          </p>
        )}
      </div>
      <Button
        onClick={handleUpload}
        disabled={!file || !title || !category || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </div>
  )
}
