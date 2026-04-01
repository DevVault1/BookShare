"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookHeart, Eye, EyeOff, Lock, Mail, MapPin, Phone, Sparkles, User } from 'lucide-react'

import { useAuthStore } from '@/lib/store/authStore'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: searchParams.get('role') || 'student',
    location: '',
    phoneNumber: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(form)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1920px] overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] lg:grid-cols-[1fr_520px]">
        {/* <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 grid-overlay opacity-20" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <BookHeart className="h-5 w-5" />
              </div>
              Adopt A Book
            </Link>
            <div className="mt-16 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/85">
                <Sparkles className="h-4 w-4" /> Premium onboarding flow
              </div>
              <h1 className="mt-6 text-5xl font-semibold leading-tight">Create your account and step into a cleaner reader-first product.</h1>
              <p className="mt-5 text-base leading-8 text-white/80">
                Choose your role, enable better security, and unlock the redesigned dashboard experience from day one.
              </p>
            </div>
          </div>
        
        </div> */}

        <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 grid-overlay opacity-20" />
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <BookHeart className="h-5 w-5" />
              </div>
              Adopt A Book
            </Link>
            <div className="mt-16 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
                <Sparkles className="h-4 w-4" /> Premium onboarding flow
              </div>
              <h1 className="mt-6 text-5xl font-semibold leading-tight">Create your account and step into a cleaner reader-first product.</h1>
              <p className="mt-5 text-base leading-8 text-white/75">
                 Choose your role, enable better security, and unlock the redesigned dashboard experience from day one.
              </p>
            </div>
          </div>
         
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center p-5 sm:p-4">
          <Card className="w-full rounded-[1.75rem] shadow-none">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:hidden">
                  <BookHeart className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Create your account</h2>
                <p className="mt-2 text-sm text-muted-foreground">Join the premium book-sharing experience in a few steps.</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                {['student', 'donor'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role }))}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${form.role === role ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                  >
                    I&apos;m a {role}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Enter Your Name" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter Your Email" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Create a secure password" className="pl-10 pr-11" required />
                    <button type="button" onClick={() => setShowPass((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="City, Country" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+94 77 123 4567" className="pl-10" />
                    </div>
                  </div>
                </div>

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}

                <Button type="submit" disabled={isLoading} className="mt-2 w-full rounded-xl">
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="relative my-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="relative z-10 bg-card px-3">or continue with</span>
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              </div>

              <SocialLoginButtons nextPath="/dashboard" />

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
