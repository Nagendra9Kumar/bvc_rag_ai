import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { EditDocumentForm } from "@/components/edit-document-form"

interface EditDocumentPageProps {
  params: {
    id: string
  }
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="mb-6 text-3xl font-bold">Edit Document</h1>

          <Card>
            <CardHeader>
              <CardTitle>Edit Document</CardTitle>
              <CardDescription>Update document details and content</CardDescription>
            </CardHeader>
            <CardContent>
              <EditDocumentForm id={params.id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

