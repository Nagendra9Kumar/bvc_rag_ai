'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface FeedbackProps {
  questionId: string
}

export function Feedback({ questionId }: FeedbackProps) {
  const [rating, setRating] = useState<'helpful' | 'not_helpful' | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!rating) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          rating,
          comment,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve.',
      })

      setRating(null)
      setComment('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Was this response helpful?</span>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={rating === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRating('helpful')}
              className="h-8 w-8 p-0"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="sr-only">Helpful</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={rating === 'not_helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRating('not_helpful')}
              className="h-8 w-8 p-0"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="sr-only">Not Helpful</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {rating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <Textarea
            placeholder="Tell us why (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-20 resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}