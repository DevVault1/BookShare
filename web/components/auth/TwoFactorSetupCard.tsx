'use client'

import { useEffect, useState } from 'react'
import { Mail, Smartphone, ShieldCheck } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore, type User } from '@/lib/store/authStore'

export default function TwoFactorSetupCard({ user, onUpdated }: { user: User; onUpdated?: () => void }) {
  const { updateUser } = useAuthStore()
  const [method, setMethod] = useState<'email' | 'sms'>(user.twoFactorMethod || 'email')
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '')
  const [code, setCode] = useState('')
  const [setupPending, setSetupPending] = useState(false)
  const [destinationHint, setDestinationHint] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMethod((user.twoFactorMethod as 'email' | 'sms') || 'email')
    setPhoneNumber(user.phoneNumber || '')
  }, [user])

  const startSetup = async (selectedMethod: 'email' | 'sms') => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/2fa/setup/request', { method: selectedMethod, phoneNumber })
      setMethod(selectedMethod)
      setSetupPending(true)
      setDestinationHint(data.destinationHint)
      setMessage(data.message)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/2fa/setup/verify', { method, code })
      updateUser(data.user)
      setSetupPending(false)
      setCode('')
      setMessage(data.message)
      onUpdated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify setup code')
    } finally {
      setLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/2fa/disable')
      updateUser(data.user)
      setSetupPending(false)
      setCode('')
      setMessage(data.message)
      onUpdated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Account protection
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Two-factor authentication</h3>
          <p className="mt-1 text-sm text-gray-500">Add a one-time code by email or SMS each time you sign in.</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${user.twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {user.twoFactorEnabled ? `Enabled via ${user.twoFactorMethod?.toUpperCase()}` : 'Disabled'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => startSetup('email')} disabled={loading} className="rounded-xl border border-gray-200 px-4 py-4 text-left transition hover:border-blue-500 hover:bg-blue-50">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <p className="font-semibold text-gray-900">Email OTP</p>
          <p className="mt-1 text-sm text-gray-500">Send verification codes to {user.email}</p>
        </button>

        <div className="rounded-xl border border-gray-200 px-4 py-4">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <p className="font-semibold text-gray-900">SMS OTP</p>
          <p className="mt-1 text-sm text-gray-500">Use a phone number if you want codes by SMS.</p>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+94 77 123 4567"
            className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <button type="button" onClick={() => startSetup('sms')} disabled={loading} className="mt-3 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100">
            Enable via SMS
          </button>
        </div>
      </div>

      {setupPending ? (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="font-semibold text-gray-900">Enter the code sent to {destinationHint}</p>
          <p className="mt-1 text-sm text-gray-600">Codes expire after 10 minutes.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="flex-1 rounded-xl border border-blue-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={verifySetup} disabled={loading || code.trim().length < 6} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
              Verify & enable
            </button>
          </div>
        </div>
      ) : null}

      {user.twoFactorEnabled ? (
        <button onClick={disableTwoFactor} disabled={loading} className="mt-5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50">
          Disable two-factor authentication
        </button>
      ) : null}

      {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    </div>
  )
}
