'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">BVC Engineering College</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/chat"
              className={pathname === '/chat' ? 'text-foreground' : 'text-foreground/60 transition-colors hover:text-foreground'}
            >
              Chat
            </Link>
            {isSignedIn && user?.publicMetadata?.role === 'admin' && (
              <Link
                href="/admin"
                className={pathname.startsWith('/admin') ? 'text-foreground' : 'text-foreground/60 transition-colors hover:text-foreground'}
              >
                Admin
              </Link>
            )}
            <Link
              href="/about"
              className={pathname === '/about' ? 'text-foreground' : 'text-foreground/60 transition-colors hover:text-foreground'}
            >
              About
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
