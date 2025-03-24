import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '../../components/navbar'
import { DocumentForm } from '../../components/document-form'
import { FileUpload } from '../../components/file-upload'
import { DocumentList } from '../../components/document-list'
import { FadeIn } from '../../components/animations/fade-in'

const tabItems = [
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'add', label: 'Add Document', icon: '✏️' },
  { value: 'upload', label: 'Upload File', icon: '📁' },
]

export default async function AdminPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-6 md:py-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your knowledge base content and documents.
            </p>
          </div>
          
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <FadeIn>
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      View and manage your knowledge base documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentList />
                  </CardContent>
                </Card>
              </FadeIn>
            </TabsContent>
            
            <TabsContent value="add" className="space-y-4">
              <FadeIn>
                <Card>
                  <CardHeader>
                    <CardTitle>Add Document</CardTitle>
                    <CardDescription>
                      Create a new document in the knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentForm />
                  </CardContent>
                </Card>
              </FadeIn>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <FadeIn>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                      Upload documents to add to the knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload />
                  </CardContent>
                </Card>
              </FadeIn>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}
