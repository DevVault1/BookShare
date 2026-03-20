'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Menu, X, Bell, User, LogOut, LayoutDashboard, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <BookOpen className="w-7 h-7" />
            <span>Adopt A Book</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/books" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">Browse</Link>
            <Link href="/books/donate" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">Donate</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">Admin</Link>
                )}
                <div className="flex items-center gap-3 ml-4">
                  <Link href="/dashboard/chat" className="text-gray-500 hover:text-blue-600 transition-colors" aria-label="Messages">
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                  <Link href="/dashboard/notifications" className="text-gray-500 hover:text-blue-600 transition-colors" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span>
                  </div>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">Sign in</Link>
                <Link href="/auth/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              <Link href="/books" className="block text-gray-600 dark:text-gray-300 py-2" onClick={() => setOpen(false)}>Browse Books</Link>
              <Link href="/books/donate" className="block text-gray-600 dark:text-gray-300 py-2" onClick={() => setOpen(false)}>Donate a Book</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block text-gray-600 dark:text-gray-300 py-2" onClick={() => setOpen(false)}>Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-left text-red-500 py-2">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block text-gray-600 dark:text-gray-300 py-2" onClick={() => setOpen(false)}>Sign in</Link>
                  <Link href="/auth/register" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center" onClick={() => setOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
