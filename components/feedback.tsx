'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface FeedbackProps {
  questionId: string
  className?: string
}

export function Feedback({ questionId, className }: FeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, type }),
      })

      if (!response.ok) throw new Error()

      setFeedback(type)
      toast({
        title: 'Thank you for your feedback!',
        description: type === 'positive' 
          ? 'We\'re glad this was helpful.'
          : 'We\'ll work on improving our responses.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      })
      setFeedback(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('mt-4 flex items-center gap-2', className)}>
      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <p className="text-xs text-muted-foreground">Was this helpful?</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-green-500 hover:bg-green-500/10 transition-colors"
              onClick={() => handleFeedback('positive')}
              disabled={isSubmitting}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="sr-only">Yes, this was helpful</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              onClick={() => handleFeedback('negative')}
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="sr-only">No, this wasn't helpful</span>
            </Button>
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-muted-foreground"
          >
            Thanks for your feedback!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}