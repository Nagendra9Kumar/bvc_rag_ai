'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserButton, SignInButton, useAuth } from '@clerk/nextjs'
import { Menu, MenuSquare, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { routes } from "@/config/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const linkStyles = {
  active: "text-foreground",
  inactive: "text-foreground/60 hover:text-foreground/80",
  mobileActive: "bg-primary/10 font-medium",
  mobileInactive: "hover:bg-muted"
};

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();
  
  // Use a slightly longer debounce to avoid UI flickering
  const { hasPermission, isLoading } = useRoleAuth(500);

  // Memoize the filtered routes to avoid unnecessary re-renders
  const visibleRoutes = useMemo(() => {
    return routes.filter(route => {
      // If route requires a role
      if (route.requiredRole) {
        if (isLoading) {
          // During loading, hide routes that require permissions
          return false;
        }
        // After loading, show routes only if user has permission
        return hasPermission(route.requiredRole);
      }
      // Routes without required roles are always visible
      return true;
    });
  }, [routes, hasPermission, isLoading]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <nav className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu size={16} strokeWidth={2} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader className="border-b pb-4 mb-4">
              {/* <SheetTitle></SheetTitle> */}
            </SheetHeader>
            <div className="flex flex-col gap-2">
              {isLoading ? (
                // Show skeleton loaders while loading
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))
              ) : (
                visibleRoutes.map((route) => (
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
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="mr-6 flex items-center space-x-2 md:mr-6 absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0">
          <span className="font-bold text-xl">BVC</span>
        </Link>

        <div className="hidden md:flex md:gap-6 lg:gap-8 justify-center flex-1">
          {isLoading ? (
            // Show skeleton loaders while loading
            <div className="flex gap-6 lg:gap-8">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          ) : (
            visibleRoutes.map((route) => (
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
            ))
          )}
        </div>
        
        {/* Rest of your navbar code remains the same */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">Sign In</Button>
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
}
