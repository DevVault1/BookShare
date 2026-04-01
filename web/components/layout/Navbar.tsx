"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BookHeart,
  BookMarked,
  BookOpen,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Shield,
  Sparkles,
  UserCircle2,
} from 'lucide-react'

import { useAuthStore } from '@/lib/store/authStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ThemeToggle from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const browseItems = [
  {
    href: '/books',
    icon: Compass,
    title: 'Explore catalog',
    description: 'Browse all available books with smart filters and search.',
  },
  {
    href: '/books?category=Technology',
    icon: Sparkles,
    title: 'Trending categories',
    description: 'Jump into high-demand subjects and curated collections.',
  },
  {
    href: '/books?category=Children',
    icon: BookMarked,
    title: 'Reader collections',
    description: 'Open focused shelves for students, kids, and casual readers.',
  },
  {
    href: '/books?condition=Like%20New',
    icon: Map,
    title: 'Nearby quality picks',
    description: 'Find books in great condition and ready for pickup.',
  },
]

const publicLinks = [
  { href: '/books', label: 'Catalog' },
  { href: '/books/donate', label: 'Donate' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const initials = useMemo(() => user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'AB', [user?.name])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <motion.nav
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel mx-auto flex max-w-[1920px] items-center justify-between rounded-[1.75rem] px-4 py-3 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:-translate-y-0.5">
              <BookHeart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-muted-foreground">Adopt A Book</div>
              <div className="text-base font-semibold">Premium book exchange</div>
            </div>
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full px-4 text-sm text-foreground">
                Browse <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[360px] p-2">
              <DropdownMenuLabel>Browse experiences</DropdownMenuLabel>
              <div className="grid gap-1">
                {browseItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="p-0 focus:bg-transparent">
                    <Link href={item.href} className="flex gap-3 rounded-2xl p-3 hover:bg-accent">
                      <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {publicLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild className="rounded-full px-4 text-sm text-muted-foreground hover:text-foreground">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="glass" size="icon" asChild className="rounded-full">
                <Link href="/dashboard/chat" aria-label="Messages">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="glass" size="icon" asChild className="relative rounded-full" aria-label="Notifications">
                <Link href="/dashboard?tab=notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-2 py-1.5 text-left shadow-sm transition hover:border-primary/30 hover:bg-background/90">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImage} alt={user.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="pr-2">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">{user.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/chat" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Messages
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Admin console
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="rounded-full px-4">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/auth/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="glass" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] rounded-l-[2rem] border-l border-border/60 sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Navigate</SheetTitle>
                <SheetDescription>Explore the catalog, manage your account, and switch themes.</SheetDescription>
              </SheetHeader>

              <div className="mt-8 space-y-8">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Browse</p>
                  <div className="space-y-2">
                    {browseItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="surface-card flex items-start gap-3 rounded-2xl p-4">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {user ? (
                  <div className="space-y-4">
                    <div className="surface-card flex items-center gap-3 rounded-2xl p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Button variant="outline" asChild className="justify-start rounded-2xl">
                        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="justify-start rounded-2xl">
                        <Link href="/dashboard/chat" onClick={() => setMobileOpen(false)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Messages
                        </Link>
                      </Button>
                      {user.role === 'admin' ? (
                        <Button variant="outline" asChild className="justify-start rounded-2xl">
                          <Link href="/admin" onClick={() => setMobileOpen(false)}>
                            <Shield className="mr-2 h-4 w-4" /> Admin console
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="destructive" onClick={handleLogout} className="justify-start rounded-2xl">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Button variant="outline" asChild className="rounded-2xl">
                      <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                    </Button>
                    <Button asChild className="rounded-2xl">
                      <Link href="/auth/register" onClick={() => setMobileOpen(false)}>Create account</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </header>
  )
}
