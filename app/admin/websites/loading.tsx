import { Loading } from '@/components/ui/loading'
import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'

export default function WebsitesLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
            <p className="text-muted-foreground">Loading website list...</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Loading size="lg" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}