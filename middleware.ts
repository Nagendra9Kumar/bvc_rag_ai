import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { useToast } from '@/components/ui/use-toast'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  try {
    const { sessionClaims } = await auth()
    const { toast } = useToast()
    // Check for admin routes
    if (isAdminRoute(req)) {
      // If not authenticated at all
      if (!sessionClaims) {
        console.log("Unauthenticated user attempted to access admin route:", req.url)
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
      }
      
      // If authenticated but not admin
      if (sessionClaims?.metadata?.role !== 'admin') {
        console.log("Unauthorized access attempt to admin route:", {
          userId: sessionClaims.sub,
          role: sessionClaims?.metadata?.role,
          route: req.url
        })
        toast({
          title: "Access Denied",
          description: "You do not have administrator privileges",
          variant: "destructive"
        })
        const url = new URL('/', req.url)
        return NextResponse.redirect(url)
      }
    }
    
    // Allow request to continue for authorized users
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, redirect to home for safety
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}