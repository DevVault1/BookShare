'use client'
import { useState } from 'react'
import StarRatingInput from '@/components/reviews/StarRatingInput'

interface ReviewFormProps {
  onSubmit: (payload: { bookRating: number; donorFeedbackRating: number; descriptionAccuracyRating: number; reviewText: string }) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export default function ReviewForm({ onSubmit, onCancel, submitLabel = 'Submit review' }: ReviewFormProps) {
  const [bookRating, setBookRating] = useState(5)
  const [donorFeedbackRating, setDonorFeedbackRating] = useState(5)
  const [descriptionAccuracyRating, setDescriptionAccuracyRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ bookRating, donorFeedbackRating, descriptionAccuracyRating, reviewText })
      setReviewText('')
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate this completed donation</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          The book rating is shown publicly on the title page. Donor feedback powers the donor reputation system.
        </p>
      </div>

      <div className="grid gap-5">
        <StarRatingInput
          label="Book rating"
          helperText="How would you rate this book overall?"
          value={bookRating}
          onChange={setBookRating}
        />
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
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Written review</label>
        <textarea
          value={reviewText}
          onChange={(e: any) => setReviewText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Share what you liked about the book and how the donation experience went..."
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-right text-xs text-gray-400 mt-1">{reviewText.length}/1000</div>
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
          disabled={submitting}
          className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
