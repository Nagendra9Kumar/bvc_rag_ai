import { Navbar } from '@/components/navbar'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">About BVC Engineering College</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              BVC Engineering College, Odalarevu, is a premier educational institution committed to providing quality technical education. Established with a vision to create competent engineers and professionals, the college has been at the forefront of technical education in the region.
            </p>
            
            <h2>Our Vision</h2>
            <p>
              To be a premier technical institution striving for excellence in education, research, and technological services contributing to the advancement of humankind.
            </p>
            
            <h2>Our Mission</h2>
            <ul>
              <li>To impart quality technical education that enables students to acquire knowledge and skills to face global challenges.</li>
              <li>To create a conducive learning environment that fosters innovation and creativity.</li>
              <li>To promote research and development activities that contribute to technological advancement.</li>
              <li>To inculcate ethical values and leadership qualities among students to make them responsible citizens.</li>
            </ul>
            
            <h2>About This Knowledge Base</h2>
            <p>
              This AI-powered knowledge base is designed to provide instant answers to questions about BVC Engineering College. It uses advanced Retrieval-Augmented Generation (RAG) technology to retrieve relevant information from a comprehensive database of college documents and generate accurate responses.
            </p>
            
            <p>
              The system is built using Next.js, OpenAI, MongoDB, and Pinecone, ensuring fast and reliable access to information. Whether you're a prospective student, current student, faculty member, or visitor, this knowledge base is here to assist you with accurate information about the college.
            </p>
          </div>
        </div>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} BVC Engineering College. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
