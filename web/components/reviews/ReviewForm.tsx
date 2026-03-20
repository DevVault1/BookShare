'use client'
import { useEffect, useState } from 'react'
import StarRatingInput from '@/components/reviews/StarRatingInput'

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
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isPublic ? 'Share a public review' : 'Rate this completed donation'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isPublic
            ? 'Public reviews are visible to other signed-in users on the book page.'
            : 'Private feedback stays inside the donation details and powers donor reputation.'}
        </p>
      </div>

      <div className="grid gap-5">
        <StarRatingInput
          label={isPublic ? 'Star rating' : 'Book rating'}
          helperText={isPublic ? 'How would you rate this book overall?' : 'How would you rate this book overall?'}
          value={bookRating}
          onChange={setBookRating}
        />

        {!isPublic && (
          <>
            <StarRatingInput
              label="Donor feedback"
              helperText="How was the donor experience from your side?"
              value={donorFeedbackRating}
              onChange={setDonorFeedbackRating}
            />
            <StarRatingInput
              label="Description accuracy"
              helperText="Did the actual book match the donor's description and condition?"
              value={descriptionAccuracyRating}
              onChange={setDescriptionAccuracyRating}
            />
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {isPublic ? 'Written comment' : 'Private notes'}
        </label>
        <textarea
          value={reviewText}
          onChange={(e: any) => setReviewText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={isPublic
            ? 'What did you think about this book? Share a helpful comment for other readers...'
            : 'Share what you liked about the book and how the donation experience went...'}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-400">{isPublic ? 'Required for public reviews' : 'Optional'}</span>
          <span className="text-gray-400">{reviewText.length}/1000</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || deleting}
          className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="border border-red-200 px-5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : deleteLabel}
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || deleting}
            className="border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
