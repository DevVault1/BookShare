"use client"

import { MessageSquareText, User } from 'lucide-react'
import StarDisplay from '@/components/reviews/StarDisplay'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface ReviewCardProps {
  review: any
  showPrivateDetails?: boolean
}

export default function ReviewCard({ review, showPrivateDetails = false }: ReviewCardProps) {
  const author = review.userId || review.receiverId
  const displayName = author?.name || 'Reader'
  const profileImage = author?.profileImage

  return (
    <Card className="rounded-[1.5rem] border-border/60">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(review.updatedAt || review.createdAt)}</p>
            </div>
          </div>
          <StarDisplay value={review.bookRating} showValue />
        </div>

        {review.reviewText ? (
          <p className="text-sm leading-7 text-muted-foreground">“{review.reviewText}”</p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareText className="h-4 w-4" />
            <span>No written review was added.</span>
          </div>
        )}

        {showPrivateDetails ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Donor experience</p>
              <div className="mt-2"><StarDisplay value={review.donorFeedbackRating} size="sm" showValue /></div>
            </div>
            <div className="rounded-2xl bg-muted/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Description accuracy</p>
              <div className="mt-2"><StarDisplay value={review.descriptionAccuracyRating} size="sm" showValue /></div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
