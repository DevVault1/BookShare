import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(new Date(date))
}

export function getConditionColor(condition: string) {
  const map: Record<string, string> = {
    'New': 'bg-green-100 text-green-700',
    'Like New': 'bg-emerald-100 text-emerald-700',
    'Good': 'bg-blue-100 text-blue-700',
    'Fair': 'bg-yellow-100 text-yellow-700',
    'Poor': 'bg-red-100 text-red-700',
  }
  return map[condition] || 'bg-gray-100 text-gray-700'
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    'available': 'bg-green-100 text-green-700',
    'requested': 'bg-yellow-100 text-yellow-700',
    'adopted': 'bg-blue-100 text-blue-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'approved': 'bg-green-100 text-green-700',
    'rejected': 'bg-red-100 text-red-700',
    'delivered': 'bg-indigo-100 text-indigo-700',
    'confirmed': 'bg-emerald-100 text-emerald-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

export function formatRating(value?: number | null) {
  if (!value || value <= 0) return 'New'
  return value.toFixed(1)
}

export function getStarFillWidth(value?: number | null) {
  if (!value || value <= 0) return '0%'
  return `${Math.max(0, Math.min(100, (value / 5) * 100))}%`
}
