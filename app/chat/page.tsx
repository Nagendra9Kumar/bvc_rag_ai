import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { ChatInterface } from '@/components/chat-interface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BVC Assistant - Chat Interface',
  description: 'Ask questions and get information about BVC Engineering College',
}

export default async function ChatPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return (
    
      <ChatInterface />
   
  )
}
