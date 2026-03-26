'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'

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
        setMethod((data.method as 'email' | 'sms') || 'email')
        setInfo(`A verification code was sent via ${(data.method || 'email').toUpperCase()} to ${data.destinationHint || 'your inbox'}.`)
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
      setPendingToken(data.pendingToken || pendingToken)
      setDestinationHint(data.destinationHint || destinationHint)
      setInfo(data.message || 'A fresh code was sent.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-2xl">
            <BookOpen className="w-8 h-8" />
            Adopt A Book
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
            {pendingToken ? 'Verify your sign-in' : 'Welcome back'}
          </h1>
          <p className="text-gray-500">
            {pendingToken ? `Enter the ${method.toUpperCase()} code sent to ${destinationHint || 'your account'}` : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          {!pendingToken ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
                {info && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{info}</div>}

                <button type="submit" disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <SocialLoginButtons nextPath="/dashboard" />
            </>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Two-factor required
                </div>
                <p className="text-sm text-gray-700">Enter the 6-digit code sent via {method.toUpperCase()} to {destinationHint}.</p>
              </div>

              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-blue-500"
              />

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
              {info && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{info}</div>}

              <button type="submit" disabled={isLoading || code.trim().length < 6} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Verify and Continue'}
              </button>
              <button type="button" onClick={handleResendCode} className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
                Resend code
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
