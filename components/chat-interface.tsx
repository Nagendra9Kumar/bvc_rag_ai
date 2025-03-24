'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, Bot, User, Loader2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { AnimatedCard } from '@/components/client/animated-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Feedback } from '@/components/feedback'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageId = nanoid()
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      })

      if (!response.ok) throw new Error()

      const data = await response.json()
      
      setMessages(prev => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: data.answer,
        },
      ])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      })
      // Remove the user message if we couldn't get a response
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
        {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex h-full items-center justify-center px-4"
            >
              <div className="max-w-lg text-center space-y-4">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  BVC Engineering College Assistant
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Ask me anything about BVC Engineering College!
                </p>
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`${
                message.role === 'assistant' ? 'mr-4 md:mr-8 lg:mr-12' : 'ml-4 md:ml-8 lg:ml-12'
              }`}
            >
              <AnimatedCard delay={index * 0.1}>
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 transition-all">
                    <AvatarImage
                      src={message.role === 'assistant' ? '/bot-avatar.png' : undefined}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10">
                      {message.role === 'assistant' ? <Bot className="h-4 w-4 md:h-5 md:w-5" /> : <User className="h-4 w-4 md:h-5 md:w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </p>
                    <div className="space-y-4 [&_p]:leading-relaxed">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="text-sm md:text-base">{line}</p>
                      ))}
                    </div>
                    {message.role === 'assistant' && (
                      <div className="mt-4">
                        <Feedback questionId={message.id} />
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          )))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mr-4 md:mr-8 lg:mr-12"
          >
            <AnimatedCard>
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src="/bot-avatar.png" className="object-cover" />
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 md:h-5 md:w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm md:text-base text-muted-foreground">
                    Thinking...
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 max-w-4xl mx-auto">
          <Input
            placeholder="Ask a question about BVC Engineering College..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 h-10 md:h-11"
          />
          <ButtonWithLoading
            type="submit"
            isLoading={isLoading}
            loadingText=""
            disabled={!input.trim() || isLoading}
            className="w-10 md:w-11 h-10 md:h-11 shrink-0"
          >
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </ButtonWithLoading>
        </form>
      </div>
    </div>
  )
}
