'use client'
import Link from 'next/link'
import { MapPin, BookOpen, ShieldCheck } from 'lucide-react'
import { cn, getConditionColor, getStatusColor, formatRating } from '@/lib/utils'
import StarDisplay from '@/components/reviews/StarDisplay'

interface BookCardProps {
  key?: string
  book: {
    _id: string
    title: string
    author: string
    category: string
    condition: string
    image?: string
    status: string
    location?: string
    ratingsAverage?: number
    ratingsCount?: number
    donorId?: {
      name: string
      profileImage?: string
      donorReputation?: {
        overallScore?: number
      }
    }
  }
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book._id}`}>
      <div className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full">
        <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700">
          {book.image ? (
            <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-blue-300" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getConditionColor(book.condition))}>
              {book.condition}
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(book.status))}>
              {book.status}
            </span>
          </div>
        </div>

        <div className="p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">{book.category}</p>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{book.author}</p>

          <div className="flex items-center justify-between gap-3 mb-2">
            {book.ratingsCount ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <StarDisplay value={book.ratingsAverage} size="sm" />
                <span>{formatRating(book.ratingsAverage)} ({book.ratingsCount})</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}

            {book.donorId?.donorReputation?.overallScore ? (
              <div className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{formatRating(book.donorId.donorReputation.overallScore)}</span>
              </div>
            ) : null}
          </div>

          {book.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{book.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
