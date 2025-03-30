import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { WebsiteList } from "@/components/website-list"
import { WebsiteForm } from "@/components/website-form"

export default async function WebsitesPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <>
      
      <main className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Website</CardTitle>
            <CardDescription>Add a new college website to scrape content from.</CardDescription>
          </CardHeader>
          <CardContent>
            <WebsiteForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Websites</CardTitle>
            <CardDescription>List of college websites being tracked.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading websites...</div>}>
              <WebsiteList />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </>
  )
}