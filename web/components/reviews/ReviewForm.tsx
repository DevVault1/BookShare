"use client"

import { useEffect, useState } from 'react'
import StarRatingInput from '@/components/reviews/StarRatingInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ReviewPayload {
  bookRating: number
  donorFeedbackRating?: number
  descriptionAccuracyRating?: number
  reviewText: string
}

interface ReviewFormProps {
  mode?: 'public' | 'private'
  initialValues?: Partial<ReviewPayload>
  onSubmit: (payload: ReviewPayload) => Promise<void>
  onCancel?: () => void
  onDelete?: () => Promise<void>
  submitLabel?: string
  deleteLabel?: string
}

export default function ReviewForm({
  mode = 'private',
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel = 'Submit review',
  deleteLabel = 'Delete review',
}: ReviewFormProps) {
  const [bookRating, setBookRating] = useState(initialValues?.bookRating ?? 5)
  const [donorFeedbackRating, setDonorFeedbackRating] = useState(initialValues?.donorFeedbackRating ?? 5)
  const [descriptionAccuracyRating, setDescriptionAccuracyRating] = useState(initialValues?.descriptionAccuracyRating ?? 5)
  const [reviewText, setReviewText] = useState(initialValues?.reviewText ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setBookRating(initialValues?.bookRating ?? 5)
    setDonorFeedbackRating(initialValues?.donorFeedbackRating ?? 5)
    setDescriptionAccuracyRating(initialValues?.descriptionAccuracyRating ?? 5)
    setReviewText(initialValues?.reviewText ?? '')
  }, [initialValues])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        bookRating,
        donorFeedbackRating,
        descriptionAccuracyRating,
        reviewText,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    setError('')
    try {
      await onDelete()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete review')
    } finally {
      setDeleting(false)
    }
  }

  const isPublic = mode === 'public'

  return (
    <Card className="rounded-[1.75rem] border-border/60">
      <CardHeader>
        <CardTitle>{isPublic ? 'Share a public review' : 'Rate this completed donation'}</CardTitle>
        <CardDescription>
          {isPublic
            ? 'Visible to signed-in readers on the book page.'
            : 'Private feedback helps improve donor trust and delivery quality.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5">
          <StarRatingInput
            label={isPublic ? 'Book rating' : 'Overall book rating'}
            helperText="How would you rate this book overall?"
            value={bookRating}
            onChange={setBookRating}
          />

          {!isPublic ? (
            <>
              <StarRatingInput
                label="Donor feedback"
                helperText="How smooth was the experience with the donor?"
                value={donorFeedbackRating}
                onChange={setDonorFeedbackRating}
              />
              <StarRatingInput
                label="Description accuracy"
                helperText="Did the book match the donor's description and condition?"
                value={descriptionAccuracyRating}
                onChange={setDescriptionAccuracyRating}
              />
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{isPublic ? 'Written comment' : 'Private notes'}</Label>
          <Textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder={isPublic
              ? 'Share a thoughtful review for future readers.'
              : 'Capture what went well and what could improve.'}
            className="min-h-[140px]"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isPublic ? 'Helpful comments build trust.' : 'Optional but encouraged.'}</span>
            <span>{reviewText.length}/1000</span>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleSubmit} disabled={submitting || deleting} className="rounded-xl">
            {submitting ? 'Saving...' : submitLabel}
          </Button>
          {onDelete ? (
            <Button type="button" variant="outline" onClick={handleDelete} disabled={submitting || deleting} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
              {deleting ? 'Deleting...' : deleteLabel}
            </Button>
          ) : null}
          {onCancel ? <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting || deleting} className="rounded-xl">Cancel</Button> : null}
        </div>
      </CardContent>
    </Card>
  )
}
