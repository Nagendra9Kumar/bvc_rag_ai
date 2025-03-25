'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, Bot, User, Loader2, Menu, AlignLeft } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Feedback } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useSWR, { mutate } from 'swr'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface Conversation {
  _id: string
  title: string
  messages: Message[]
  createdAt: number
  userId: string
}

interface UpdateConversationRequest {
  title: string;
  messages: Message[];
}

interface ConversationsResponse {
  conversations: Conversation[];
}

// SWR fetcher function with type
const fetcher = (url: string): Promise<ConversationsResponse> => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
})

export function ChatInterface() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Fetch conversations with SWR for real-time updates
  const { data, error, isLoading } = useSWR<ConversationsResponse>(
    isUserLoaded && user ? '/api/conversations' : null, 
    fetcher
  )
  
  const conversations: Conversation[] = data?.conversations || []

  // Set active conversation when data loads
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      // Sort by createdAt and get the most recent
      const mostRecent = [...conversations].sort((a, b) => b.createdAt - a.createdAt)[0]
      setActiveConversation(mostRecent._id)
      setMessages(mostRecent.messages)
    }
  }, [conversations, activeConversation])

  // Auto-focus input field when conversation changes
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Create a new conversation
  const createNewConversation = async (): Promise<void> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Chat',
          messages: [],
        }),
      })

      if (!response.ok) throw new Error('Failed to create conversation')
      
      const newConversation = await response.json() as Conversation
      
      // Update the local data
      mutate('/api/conversations', {
        conversations: [newConversation, ...conversations]
      }, false)
      
      setActiveConversation(newConversation._id)
      setMessages([])
      setMobileSidebarOpen(false)
      
      // Refresh the data
      mutate('/api/conversations')
      
      // Focus the input field
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create a new conversation. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Switch to another conversation
  const switchConversation = useCallback((id: string): void => {
    console.log('Switching to conversation:', id)
    const conversation = conversations.find(c => c._id === id)
    if (conversation) {
      setActiveConversation(id)
      setMessages(conversation.messages)
      setMobileSidebarOpen(false)
    } else {
      console.error('Conversation not found:', id)
    }
  }, [conversations, setActiveConversation, setMessages, setMobileSidebarOpen])

  // Delete a conversation
  const deleteConversation = async (id: string, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation()
    
    // Confirmation for deleting the last conversation
    if (conversations.length === 1) {
      if (!confirm('Delete your only conversation? This cannot be undone.')) {
        return
      }
    }
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete conversation')
      
      // Update local state first for faster UI response
      const updatedConversations = conversations.filter(c => c._id !== id)
      mutate('/api/conversations', { conversations: updatedConversations }, false)
      
      // If deleted the active conversation, set active to the first remaining one or null
      if (activeConversation === id) {
        if (updatedConversations.length > 0) {
          setActiveConversation(updatedConversations[0]._id)
          setMessages(updatedConversations[0].messages)
        } else {
          setActiveConversation(null)
          setMessages([])
        }
      }
      
      // Refresh data from server
      mutate('/api/conversations')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the conversation. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Update conversation title based on first message
  const updateConversationTitle = async (messages: Message[]): Promise<void> => {
    if (messages.length >= 2 && activeConversation) {
      // Extract a title from the first user message
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        const title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
        
        try {
          await fetch(`/api/conversations/${activeConversation}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              messages,
            } as UpdateConversationRequest),
          })
          
          // Update local state for UI responsiveness
          const updatedConversations = conversations.map(conv => 
            conv._id === activeConversation
              ? { ...conv, title, messages }
              : conv
          )
          
          mutate('/api/conversations', { conversations: updatedConversations }, false)
          
          // Refresh data from server
          mutate('/api/conversations')
        } catch (error) {
          console.error('Failed to update conversation title:', error)
        }
      }
    }
  }

  // Handle keyboard shortcut to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  // Submit the form and process the chat
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    
    // Create a new conversation if there isn't an active one
    if (!activeConversation) {
      await createNewConversation()
      // Exit early as createNewConversation will re-render and we'll start fresh
      return 
    }

    const messageId = nanoid()
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    
    // Update the conversation with the new message optimistically
    const updatedConversations = conversations.map(conv => 
      conv._id === activeConversation
      ? { ...conv, messages: updatedMessages }
      : conv
    );
    
    try {
      await fetch(`/api/conversations/${activeConversation}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: conversations.find(c => c._id === activeConversation)?.title || 'New Chat',
          messages: updatedMessages,
        } as UpdateConversationRequest),
      })
    } catch (error) {
      console.error('Failed to save user message:', error)
    }

    setInput('')
    setIsProcessing(true)

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      })

      if (!response.ok) throw new Error()

      const data = await response.json() as { answer: string }
      
      const aiMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now()
      }
      
      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)
      
      // Update the conversation with the AI response
      try {
        await fetch(`/api/conversations/${activeConversation}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: conversations.find(c => c._id === activeConversation)?.title || 'New Chat',
            messages: finalMessages,
          } as UpdateConversationRequest),
        })
        
        // Update local state
        const withAiResponse = conversations.map(conv => 
          conv._id === activeConversation
            ? { ...conv, messages: finalMessages }
            : conv
        )
        
        mutate('/api/conversations', { conversations: withAiResponse }, false)
        
        // Refresh data
        mutate('/api/conversations')
      } catch (error) {
        console.error('Failed to save AI response:', error)
      }
      
      // Update the conversation title if needed
      updateConversationTitle(finalMessages)
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      })
      
      // Revert the user message
      setMessages(messages)
      
      // Revert in database too
      try {
        await fetch(`/api/conversations/${activeConversation}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: conversations.find(c => c._id === activeConversation)?.title || 'New Chat',
            messages: messages,
          } as UpdateConversationRequest),
        })
        
        mutate('/api/conversations')
      } catch (error) {
        console.error('Failed to revert message:', error)
      }
    } finally {
      setIsProcessing(false)
      // Focus the input field after response
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // Helper to format timestamp
  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return ''
    return format(new Date(timestamp), 'h:mm a')
  }

  // Show loading indicator while initial data is loading
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  // Show error if data fetching failed
  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center max-w-md p-6">
          <p className="text-destructive mb-4">Failed to load conversations</p>
          <Button onClick={() => mutate('/api/conversations')}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Mobile menu - this should be visible at all times on mobile */}
      <div className="absolute left-0 right-0  z-40 p-4 flex items-center md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="mr-2"
        >
          <AlignLeft className="h-5 w-5" />
        </Button>
       
      </div>
      
      {/* Sidebar overlay for mobile */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Use the ConversationSidebar component */}
      <ConversationSidebar
        activeConversation={activeConversation}
        onSwitchConversation={switchConversation}
        mobileSidebarOpen={mobileSidebarOpen}
        onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
      />
      
      {/* Chat main area */}
      <div className="flex-1 flex flex-col mt-16 md:mt-0 ">
        {/* Rest of the chat interface with messages, input form, etc... */}
        
        {/* Empty state when no conversation is selected */}
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <h3 className="text-lg font-medium mb-2">Welcome to BVC Assistant</h3>
              <p className="text-muted-foreground mb-4">Start a new conversation or select an existing one.</p>
              <Button onClick={createNewConversation}>New Conversation</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md p-6">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto py-6 space-y-6">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex items-start gap-3",
                        message.role === 'assistant' ? "justify-start" : "justify-end"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "rounded-lg px-4 py-2.5 max-w-[85%]",
                        message.role === 'assistant' 
                          ? "bg-muted/50" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        <div className="prose dark:prose-invert prose-sm">
                          {message.content}
                        </div>
                        {message.timestamp && (
                          <div className={cn(
                            "text-xs mt-1",
                            message.role === 'assistant' 
                              ? "text-muted-foreground" 
                              : "text-primary-foreground/80"
                          )}>
                            {formatTime(message.timestamp)}
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="mt-0.5">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                          {user?.imageUrl && (
                            <AvatarImage src={user.imageUrl} alt="User" />
                          )}
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input form */}
            <div className="border-t bg-background p-4">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    ref={inputRef}
                    className="flex-1"
                  />
                  <ButtonWithLoading
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    isLoading={isProcessing}
                  >
                    <SendHorizontal className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </ButtonWithLoading>
                </form>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  BVC Assistant helps with business process questions.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
