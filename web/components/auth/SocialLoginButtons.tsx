'use client'

import { Chrome, Facebook } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export default function SocialLoginButtons({ nextPath = '/dashboard' }: { nextPath?: string }) {
  const startSocialLogin = (provider: 'google' | 'facebook') => {
    const url = `${API}/oauth/${provider}/start?next=${encodeURIComponent(nextPath)}`
    window.location.href = url
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => startSocialLogin('google')}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <Chrome className="h-4 w-4" />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => startSocialLogin('facebook')}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <Facebook className="h-4 w-4" />
        Continue with Facebook
      </button>
    </div>
  )
}
