'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, Bot, User, Loader2, PlusSquare, MessageSquare, Trash2, ArrowLeft } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'
import { ButtonWithLoading } from '@/components/client/button-with-loading'
import { AnimatedCard } from '@/components/client/animated-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Feedback } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

export function ChatInterface() {
  const { user } = useUser()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load chats from local storage on initial render
  useEffect(() => {
    const savedChats = localStorage.getItem('bvc-chats')
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      setChats(parsedChats)
      
      // Set active chat to the most recent one if it exists
      if (parsedChats.length > 0) {
        const mostRecentChat = parsedChats.sort((a: Chat, b: Chat) => b.createdAt - a.createdAt)[0]
        setActiveChat(mostRecentChat.id)
        setMessages(mostRecentChat.messages)
      }
    }
  }, [])

  // Save chats to local storage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('bvc-chats', JSON.stringify(chats))
    } else {
      localStorage.removeItem('bvc-chats')
    }
  }, [chats])

  // Auto-focus the input field when a chat is activated
  useEffect(() => {
    if (activeChat && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createNewChat = () => {
    const newChatId = nanoid()
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    }
    
    setChats(prev => [newChat, ...prev])
    setActiveChat(newChatId)
    setMessages([])
    setMobileSidebarOpen(false)
    
    // Focus the input field after creating a new chat
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const switchChat = (chatId: string) => {
    setActiveChat(chatId)
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setMessages(chat.messages)
    }
    setMobileSidebarOpen(false)
  }

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If there's only one chat left, create a confirmation dialog
    if (chats.length === 1) {
      if (!confirm('Delete your only conversation? This cannot be undone.')) {
        return
      }
    }
    
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    
    // If deleted the active chat, set active to the first remaining chat or null
    if (activeChat === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0].id)
        setMessages(remainingChats[0].messages)
      } else {
        setActiveChat(null)
        setMessages([])
      }
    }
  }

  const updateChatTitle = (messages: Message[]) => {
    if (messages.length >= 2 && activeChat) {
      // Extract a title from the first user message
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        const title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
        
        setChats(prev => prev.map(chat => 
          chat.id === activeChat 
            ? { ...chat, title, messages } 
            : chat
        ))
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter, but not with Shift+Enter (new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    // Create a new chat if there isn't an active one
    if (!activeChat) {
      createNewChat()
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
    
    // Update the current chat with the new message
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: updatedMessages } 
        : chat
    ))

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
      
      const aiMessage = {
        id: nanoid(),
        role: 'assistant' as const,
        content: data.answer,
        timestamp: Date.now()
      }
      
      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)
      
      // Update the chat with both messages
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: finalMessages } 
          : chat
      ))
      
      // Update the chat title based on conversation
      updateChatTitle(finalMessages)
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      })
      
      // Revert the user message in the chat
      setMessages(messages)
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages } 
          : chat
      ))
    } finally {
      setIsLoading(false)
      // Focus the input field after response
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // Helper to format timestamp
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return format(new Date(timestamp), 'h:mm a')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar overlay for mobile */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Chat history sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-72 md:w-80 bg-muted/30 border-r z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-16 md:pt-0">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-semibold">BVC Assistant</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={createNewChat} className="gap-1.5">
                    <PlusSquare className="h-3.5 w-3.5" />
                    
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start a new conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No chat history</p>
                <p className="text-sm">Start a new conversation</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map(chat => (
                  <div 
                    key={chat.id}
                    onClick={() => switchChat(chat.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md p-2 cursor-pointer hover:bg-accent group transition-colors duration-150",
                      activeChat === chat.id ? "bg-accent/80 hover:bg-accent/80" : "hover:bg-accent/50"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate flex-1">{chat.title}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteChat(chat.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete conversation</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile toggle button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed left-4 top-20 z-30 md:hidden shadow-sm"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? 
          <ArrowLeft className="h-4 w-4" /> : 
          <MessageSquare className="h-4 w-4" />
        }
      </Button>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col w-full md:w-[calc(100%-20rem)]">
        {activeChat && (
          <div className="border-b py-2 px-4 hidden md:flex items-center justify-between bg-muted/20">
            <h3 className="text-sm font-medium">
              {chats.find(c => c.id === activeChat)?.title || 'New Chat'}
            </h3>
            <Button variant="ghost" size="sm" onClick={createNewChat} className="gap-1.5">
              <PlusSquare className="h-3.5 w-3.5" /> 
              New Chat
            </Button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-2 md:px-4 lg:px-6 py-6 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-full items-center justify-center px-4 min-h-[60vh]"
                >
                  <div className="max-w-lg text-center space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      BVC Engineering College Assistant
                    </h2>
                    <p className="text-muted-foreground text-base">
                      Ask me anything about BVC Engineering College! I can help with admissions, courses, faculty information, campus facilities, and more.
                    </p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto">
                      {[
                        "What programs does BVC offer?",
                        "Tell me about admission requirements",
                        "What facilities are available on campus?",
                        "Who are the key faculty members?"
                      ].map((suggestion, i) => (
                        <Button 
                          key={i}
                          variant="outline" 
                          className="justify-start h-auto py-2.5 px-4 text-sm"
                          onClick={() => setInput(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                messages.map((message, index) => {
                  const isUser = message.role === 'user'
                  const showTimestamp = index === 0 || 
                    (message.timestamp && messages[index-1]?.timestamp && 
                     (message.timestamp - messages[index-1].timestamp! > 5 * 60 * 1000))
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {showTimestamp && message.timestamp && (
                        <div className="flex justify-center my-2">
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                            {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
                        {!isUser && (
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src="/bot-avatar.png" />
                            <AvatarFallback className="bg-primary/10">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "relative max-w-[85%] md:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl text-sm md:text-base",
                          isUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted/50"
                        )}>
                          <div className="space-y-2">
                            {message.content.split('\n').map((line, i) => (
                              line ? <p key={i}>{line}</p> : <br key={i} />
                            ))}
                          </div>
                          
                          <div className="text-xs opacity-70 text-right mt-1">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        
                        {isUser && (
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="ml-11 mt-1">
                          <Feedback questionId={message.id} />
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3"
              >
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 px-4 py-3 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"></span>
                  </div>
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3 md:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 max-w-4xl mx-auto relative">
            <Input
              ref={inputRef}
              placeholder="Ask a question about BVC Engineering College..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 h-11 md:h-12 py-2 px-4 pr-10"
            />
            <ButtonWithLoading
              type="submit"
              isLoading={isLoading}
              loadingText=""
              disabled={!input.trim() || isLoading}
              className="w-11 md:w-12 h-11 md:h-12 shrink-0 rounded-full"
              title="Send message"
              aria-label="Send message"
            >
              <SendHorizontal className="h-5 w-5" />
            </ButtonWithLoading>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-3">
            BVC Assistant provides information based on the available documents. Information may not be complete or fully accurate.
          </p>
        </div>
      </div>
    </div>
  )
}
