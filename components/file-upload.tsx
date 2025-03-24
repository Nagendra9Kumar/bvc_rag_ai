'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  onUploadStart: () => void
  onUploadComplete: (result: { content: string }) => void
  onUploadError: (error: string) => void
}

export function FileUpload({ onUploadStart, onUploadComplete, onUploadError }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setCurrentFile(file)
    onUploadStart()
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setUploadProgress(100)
      const data = await response.json()
      onUploadComplete(data)
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setTimeout(() => {
        setCurrentFile(null)
        setUploadProgress(0)
      }, 1000)
    }
  }, [onUploadStart, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10485760, // 10MB
    maxFiles: 1,
  })

  const handleCancel = () => {
    setCurrentFile(null)
    setUploadProgress(0)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative rounded-lg border-2 border-dashed p-6 transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop the file here' : 'Drop file here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports TXT, PDF, DOC, DOCX (max 10MB)
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {currentFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{currentFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel upload</span>
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
