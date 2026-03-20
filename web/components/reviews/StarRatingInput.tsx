'use client'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
}

export default function StarRatingInput({ label, value, onChange, helperText }: StarRatingInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          {helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{helperText}</p>}
        </div>
        <span className="text-sm font-semibold text-blue-600">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const ratingValue = index + 1
          return (
            <button
              key={ratingValue}
              type="button"
              onClick={() => onChange(ratingValue)}
              className="p-1"
              aria-label={`${label}: ${ratingValue} stars`}
            >
              <Star
                className={cn('w-6 h-6 transition-colors', ratingValue <= value ? 'text-yellow-400' : 'text-gray-300')}
                fill={ratingValue <= value ? 'currentColor' : 'none'}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
