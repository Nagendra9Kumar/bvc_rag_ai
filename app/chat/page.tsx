import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { ChatInterface } from '@/components/chat-interface'

export default async function ChatPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto">
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
