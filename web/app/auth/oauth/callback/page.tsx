'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'

function readHashParams() {
  const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
  return new URLSearchParams(raw)
}

export default function OAuthCallbackPage() {
  const router = useRouter()
  const { hydrateSessionFromToken, verifyTwoFactorLogin, resendTwoFactorLogin } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [destinationHint, setDestinationHint] = useState('')
  const [method, setMethod] = useState('email')
  const [nextPath, setNextPath] = useState('/dashboard')
  const [code, setCode] = useState('')
  const [info, setInfo] = useState('')

  const requiresTwoFactor = useMemo(() => !!pendingToken, [pendingToken])

  useEffect(() => {
    const params = readHashParams()
    const token = params.get('token')
    const errorMessage = params.get('error')
    const pending = params.get('pendingToken')
    const methodValue = params.get('method') || 'email'
    const destination = params.get('destinationHint') || ''
    const next = params.get('next') || '/dashboard'

    setNextPath(next)

    if (errorMessage) {
      setError(errorMessage)
      setLoading(false)
      return
    }

    if (pending) {
      setPendingToken(pending)
      setMethod(methodValue)
      setDestinationHint(destination)
      setLoading(false)
      return
    }

    if (token) {
      hydrateSessionFromToken(token)
        .then(() => router.replace(next))
        .catch(() => {
          setError('Failed to finish social sign-in.')
          setLoading(false)
        })
      return
    }

    setError('No sign-in information was returned.')
    setLoading(false)
  }, [hydrateSessionFromToken, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyTwoFactorLogin(pendingToken, code)
      router.replace(nextPath)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const data = await resendTwoFactorLogin(pendingToken)
      setPendingToken(data.pendingToken || pendingToken)
      setDestinationHint(data.destinationHint || destinationHint)
      setInfo(data.message || 'A new code has been sent.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600">
            <BookOpen className="h-8 w-8" /> Adopt A Book
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Completing sign-in</h1>
          <p className="mt-2 text-sm text-gray-500">We&apos;re finalizing your secure login.</p>
        </div>

        {loading && !requiresTwoFactor ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">Please wait...</div>
        ) : null}

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div> : null}

        {requiresTwoFactor ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Two-factor required
              </div>
              <p className="text-sm text-gray-700">
                Enter the code sent via {method.toUpperCase()} to <span className="font-semibold">{destinationHint}</span>.
              </p>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={loading || code.trim().length < 6} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
              Verify and continue
            </button>
            <button type="button" onClick={handleResend} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
              Resend code
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
