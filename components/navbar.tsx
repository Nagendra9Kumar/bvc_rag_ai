'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const linkStyles = {
  active: "text-foreground",
  inactive: "text-foreground/60 hover:text-foreground/80",
  mobileActive: "bg-primary/10 font-medium",
  mobileInactive: "hover:bg-muted"
};

const routes = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/admin/websites', label: 'Manage Websites' },
  { href: '/about', label: 'About' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <nav className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild className="mr-2 md:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader className="border-b pb-4 mb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    pathname === route.href
                      ? `${linkStyles.mobileActive} text-foreground`
                      : `${linkStyles.mobileInactive} text-foreground/60`
                  }`}
                  aria-current={pathname === route.href ? 'page' : undefined}
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Add your logo/icon here */}
          <span className="font-bold text-xl">BVC</span>
        </Link>

        <div className="hidden md:flex md:gap-6 lg:gap-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`relative text-sm font-medium transition-colors ${
                pathname === route.href ? linkStyles.active : linkStyles.inactive
              }`}
              aria-current={pathname === route.href ? 'page' : undefined}
            >
              {pathname === route.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-foreground"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              {route.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </nav>
    </header>
  )
}
