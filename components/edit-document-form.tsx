"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface EditDocumentFormProps {
  id: string
}

export function EditDocumentForm({ id }: EditDocumentFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch document")
        }

        const data = await response.json()
        setTitle(data.document.title)
        setContent(data.document.content)
        setCategory(data.document.category)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch document",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id, toast])

  const handleSubmit = async () => {
    if (!title || !content || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update document")
      }

      toast({
        title: "Document updated",
        description: "Your document has been updated successfully",
      })

      router.push("/admin")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title" />
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
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => router.push("/admin")} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title || !content || !category || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

