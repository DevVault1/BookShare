"use client"

import { Chrome, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export default function SocialLoginButtons({ nextPath = '/dashboard' }: { nextPath?: string }) {
  const startSocialLogin = (provider: 'google' | 'facebook') => {
    const url = `${API}/oauth/${provider}/start?next=${encodeURIComponent(nextPath)}`
    window.location.href = url
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button type="button" variant="outline" onClick={() => startSocialLogin('google')} className="h-11 rounded-xl">
        <Chrome className="mr-2 h-4 w-4" /> Continue with Google
      </Button>
      <Button type="button" variant="outline" onClick={() => startSocialLogin('facebook')} className="h-11 rounded-xl">
        <Facebook className="mr-2 h-4 w-4" /> Continue with Facebook
      </Button>
    </div>
  )
}
