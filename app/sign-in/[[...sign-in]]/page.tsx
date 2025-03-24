import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'

export default async function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* <main className="flex-1">
        <div className="container flex items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 bg-primary/5 rounded-3xl blur-2xl" />
            <SignIn
              afterSignInUrl="/"
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xl",
                  headerTitle: "text-2xl font-bold tracking-tight",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  formFieldInput: "bg-background border-input",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                  formFieldLabel: "text-foreground",
                  footerActionLink: "text-primary hover:text-primary/90",
                  socialButtonsBlockButton: "border-border bg-background hover:bg-muted",
                  socialButtonsBlockButtonText: "text-foreground",
                }
              }}
            />
          </motion.div>
        </div>
      </main> */}
      <SignIn/>
    </div>
  )
}
