'use client'
import { Star } from 'lucide-react'
import { cn, getStarFillWidth } from '@/lib/utils'

interface StarDisplayProps {
  value?: number | null
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export default function StarDisplay({ value = 0, size = 'md', showValue = false, className }: StarDisplayProps) {
  const safeValue = value ?? 0
  const iconSize = sizeMap[size]
  const fillWidth = getStarFillWidth(safeValue)

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="relative inline-flex">
        <div className="flex gap-0.5 text-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={iconSize} fill="currentColor" />
          ))}
        </div>
        <div className="absolute inset-0 overflow-hidden text-yellow-400" style={{ width: fillWidth }}>
          <div className="flex gap-0.5 w-max">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className={iconSize} fill="currentColor" />
            ))}
          </div>
        </div>
      </div>
      {showValue && safeValue > 0 && <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{safeValue.toFixed(1)}</span>}
    </div>
  )
}
