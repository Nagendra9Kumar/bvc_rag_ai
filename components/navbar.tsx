'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { MoonIcon, SunIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/chat', label: 'Chat' },
  { href: '/admin', label: 'Admin', adminOnly: true },
  { href: '/about', label: 'About' }
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  
  return (
    <motion.header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <motion.span 
              className="font-bold text-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              BVC Engineering College
            </motion.span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              if (item.adminOnly && (!isSignedIn || user?.publicMetadata?.role !== 'admin')) {
                return null
              }
              
              const isActive = item.href === pathname || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <motion.div key={item.href} whileHover={{ y: -2 }}>
                  <Link
                    href={item.href}
                    className={`${
                      isActive 
                        ? 'text-foreground font-semibold' 
                        : 'text-muted-foreground hover:text-foreground'
                    } transition-colors`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>
        
        <div className="flex md:hidden">
          <Link href="/" className="flex items-center">
            <span className="font-bold">BVC</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Toggle Theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </motion.div>
          
          {isSignedIn ? (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full ring-2 ring-primary/10"
                }
              }}
            />
          ) : (
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button asChild variant="default" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
