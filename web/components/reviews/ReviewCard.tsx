'use client'
import { MessageSquareText, User } from 'lucide-react'
import StarDisplay from '@/components/reviews/StarDisplay'
import { formatDate } from '@/lib/utils'

interface ReviewCardProps {
  key?: string
  review: any
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center overflow-hidden">
            {review.receiverId?.profileImage ? (
              <img src={review.receiverId.profileImage} alt={review.receiverId.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{review.receiverId?.name || 'Reader'}</p>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarDisplay value={review.bookRating} showValue />
      </div>

      {review.reviewText ? (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">“{review.reviewText}”</p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <MessageSquareText className="w-4 h-4" />
          <span>No written review was added.</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-3">
          <p className="text-gray-500 mb-1">Donor experience</p>
          <StarDisplay value={review.donorFeedbackRating} size="sm" showValue />
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-3">
          <p className="text-gray-500 mb-1">Description accuracy</p>
          <StarDisplay value={review.descriptionAccuracyRating} size="sm" showValue />
        </div>
      </div>
    </div>
  )
}
