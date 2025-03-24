'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const routes = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/admin/websites', label: 'Manage Websites' },
  { href: '/about', label: 'About' },
]

export function Navbar() {
  const pathname = usePathname()

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
                      ? 'bg-primary/10 font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex md:gap-6 lg:gap-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`relative text-sm font-medium transition-colors hover:text-foreground/80 ${
                pathname === route.href ? 'text-foreground' : 'text-foreground/60'
              }`}
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
