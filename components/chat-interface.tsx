'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: {
    id: string
    title: string
    category: string
  }[]
}

interface FeedbackProps {
  questionId: string
}

function Feedback({ questionId }: FeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmitFeedback = async () => {
    if (rating === null) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          rating,
          comment,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }
      
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
      })
      
      setRating(null)
      setComment('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="mt-2 flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Was this helpful?</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              variant={rating === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRating(value)}
              className="h-8 w-8 p-0"
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      {rating !== null && (
        <>
          <Textarea
            placeholder="Any additional comments? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-20 resize-none"
          />
          <Button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
            className="self-end"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </>
      )}
    </div>
  )
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isSignedIn, user } = useUser()
  const { toast } = useToast()
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get answer')
      }
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get an answer. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                BVC Engineering College Assistant
              </h2>
              <p className="text-muted-foreground">
                Ask me anything about BVC Engineering College!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className={message.role === 'user' ? 'ml-12' : 'mr-12'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    {message.role === 'user' ? (
                      <>
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || 'U'}
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/bot-avatar.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {message.role === 'assistant' && message.sources && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Sources:
                        </p>
                        <ul key={message.id} className="mt-2 text-sm text-muted-foreground">
                          {message.sources.map((source) => (
                            <li key={source.id}>
                              {source.title} ({source.category})
                            </li>
                          ))}
                        </ul>
                        <Feedback questionId={message.id} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {isLoading && (
          <Card className="mr-12">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Thinking...
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Ask a question about BVC Engineering College..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            className="min-h-12 flex-1 resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
