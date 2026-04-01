"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookHeart, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'

import { useAuthStore } from '@/lib/store/authStore'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { login, verifyTwoFactorLogin, resendTwoFactorLogin, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [destinationHint, setDestinationHint] = useState('')
  const [method, setMethod] = useState<'email' | 'sms'>('email')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      const data = await login(email, password)
      if (data.requiresTwoFactor && data.pendingToken) {
        setPendingToken(data.pendingToken)
        setDestinationHint(data.destinationHint || '')
        setMethod(data.method || 'email')
        setInfo('We sent a one-time passcode to continue signing in.')
        return
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await verifyTwoFactorLogin(pendingToken, code)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleResendCode = async () => {
    setError('')
    try {
      const data = await resendTwoFactorLogin(pendingToken)
      setInfo(data.message || 'A fresh code has been sent.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1920px] overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] lg:grid-cols-[1fr_480px]">
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
                <Sparkles className="h-4 w-4" /> Premium reader and donor experience
              </div>
              <h1 className="mt-6 text-5xl font-semibold leading-tight">Welcome back to the smarter book-sharing workspace.</h1>
              <p className="mt-5 text-base leading-8 text-white/75">
                Sign in to manage requests, track deliveries, reply to messages, and keep your community profile polished.
              </p>
            </div>
          </div>
         
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center p-5 sm:p-4 ">
          <Card className="w-full max-w-md rounded-[1.75rem] shadow-none">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:hidden">
                  <BookHeart className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Sign in</h2>
                <p className="mt-2 text-sm text-muted-foreground">Access your dashboard, chat, and analytics.</p>
              </div>

              {!pendingToken ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="pl-10 pr-11" required />
                      <button type="button" onClick={() => setShowPass((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}
                  {info ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{info}</div> : null}

                  <Button type="submit" disabled={isLoading} className="w-full rounded-xl">
                    {isLoading ? 'Signing in...' : 'Continue'}
                  </Button>

                  <div className="relative py-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="relative z-10 bg-card px-3">or continue with</span>
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                  </div>

                  <SocialLoginButtons nextPath="/dashboard" />
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" /> Two-factor authentication
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Enter the 6-digit code sent via {method.toUpperCase()} to {destinationHint || 'your inbox'}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Verification code</Label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="text-center text-lg tracking-[0.35em]" maxLength={6} />
                  </div>

                  {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}
                  {info ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{info}</div> : null}

                  <Button type="submit" disabled={isLoading || code.trim().length < 6} className="w-full rounded-xl">
                    {isLoading ? 'Verifying...' : 'Verify and continue'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResendCode} className="w-full rounded-xl">
                    Resend code
                  </Button>
                </form>
              )}

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:underline">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
