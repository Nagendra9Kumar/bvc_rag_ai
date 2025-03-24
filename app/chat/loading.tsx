import { Loading } from '@/components/ui/loading'
import { Navbar } from '@/components/navbar'

export default function ChatLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-6">
        <Loading size="lg" text="Loading chat interface..." />
      </main>
    </div>
  )
}