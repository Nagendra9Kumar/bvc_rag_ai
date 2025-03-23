'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface Document {
  _id: string
  title: string
  category: string
  createdAt: string
  updatedAt: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  
  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchDocuments()
  }, [])
  
  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id)
    setDeleteDialogOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      
      toast({
        title: 'Document deleted',
        description: 'The document has been deleted successfully',
      })
      
      setDocuments((prev) =>
        prev.filter((doc) => doc._id !== documentToDelete)
      )
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
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
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No documents found
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.category}</TableCell>
                <TableCell>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <a href={`/admin/documents/edit/${doc._id}`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(doc._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
