import { Loading } from '@/components/ui/loading'
import { Navbar } from '@/components/navbar'

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
          <Loading size="lg" />
        </div>
      </main>
    </div>
  )
}