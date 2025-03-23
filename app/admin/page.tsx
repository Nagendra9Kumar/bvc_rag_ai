import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { DocumentForm } from '@/components/document-form'
import { FileUpload } from '@/components/file-upload'
import { DocumentList } from '@/components/document-list'

export default async function AdminPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
          
          <Tabs defaultValue="documents">
            <TabsList className="mb-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="add">Add Document</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Manage your knowledge base documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentList />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add Document</CardTitle>
                  <CardDescription>
                    Add a new document to the knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentForm />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload File</CardTitle>
                  <CardDescription>
                    Upload a file to the knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
