'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, MapPin, User, MessageCircle, Heart, ArrowLeft, ShieldCheck, Clock3, BadgeCheck } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, getConditionColor, getStatusColor, formatDate, formatRating } from '@/lib/utils'
import Link from 'next/link'
import StarDisplay from '@/components/reviews/StarDisplay'
import ReviewCard from '@/components/reviews/ReviewCard'

export default function BookDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [book, setBook] = useState<any>(null)
  const [reviewsData, setReviewsData] = useState<any>({ reviews: [], summary: { reviewsCount: 0 } })
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requestMsg, setRequestMsg] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          api.get(`/books/${id}`),
          api.get(`/reviews/book/${id}`),
        ])
        setBook(bookRes.data)
        setReviewsData(reviewsRes.data)
      } catch {
        router.push('/books')
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [id, router])

  const handleRequest = async () => {
    if (!user) return router.push('/auth/login')
    setRequesting(true)
    setError('')
    try {
      await api.post('/requests', { bookId: id, message: requestMsg })
      setSuccess('Request sent successfully! The donor will review it soon.')
      setShowRequestForm(false)
      const { data } = await api.get(`/books/${id}`)
      setBook(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!book) return null

  const isOwner = user?._id === book.donorId?._id
  const canRequest = !!user && !isOwner && book.status === 'available'
  const donorReputation = book.donorId?.donorReputation

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Books
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden shadow-lg">
              {book.image ? (
                <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-blue-300" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={cn('text-sm font-medium px-3 py-1 rounded-full', getConditionColor(book.condition))}>
                  {book.condition}
                </span>
                <span className={cn('text-sm font-medium px-3 py-1 rounded-full', getStatusColor(book.status))}>
                  {book.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Book rating</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay value={book.ratingsAverage} showValue />
                    <span className="text-sm text-gray-500">{book.ratingsCount || 0} review{book.ratingsCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
                {donorReputation?.overallScore ? (
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Donor reputation</p>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <ShieldCheck className="w-4 h-4" /> {formatRating(donorReputation.overallScore)} / 5
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="text-blue-600 font-semibold mb-2">{book.category}</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">by {book.author}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <StarDisplay value={book.ratingsAverage} size="sm" />
                  <span>{book.ratingsCount ? `${formatRating(book.ratingsAverage)} from ${book.ratingsCount} review${book.ratingsCount === 1 ? '' : 's'}` : 'No reviews yet'}</span>
                </div>
                {donorReputation?.overallScore ? (
                  <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-4 h-4" />
                    Trusted donor: {formatRating(donorReputation.overallScore)}
                  </div>
                ) : null}
              </div>
            </div>

            {book.description && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{book.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
              {[
                { label: 'Language', value: book.language || 'English' },
                { label: 'Pages', value: book.pages || 'N/A' },
                { label: 'ISBN', value: book.isbn || 'N/A' },
                { label: 'Published', value: book.publishedYear || 'N/A' },
                { label: 'Listed', value: formatDate(book.createdAt) },
                { label: 'Metadata', value: book.metadataSource ? String(book.metadataSource).replace(/_/g, ' ') : 'Manual entry' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</p>
                </div>
              ))}
            </div>

            {book.donorId && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {book.donorId.profileImage ? (
                      <img src={book.donorId.profileImage} alt={book.donorId.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Donated by</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{book.donorId.name}</p>
                    {book.donorId.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{book.donorId.location}
                      </p>
                    )}
                  </div>
                </div>

                {donorReputation?.overallScore ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-4">
                      <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <p className="text-sm font-semibold">Overall</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRating(donorReputation.overallScore)}</p>
                      <p className="text-xs text-gray-400 mt-1">Based on receiver feedback and response time</p>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-4">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Clock3 className="w-4 h-4" />
                        <p className="text-sm font-semibold">Response speed</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRating(donorReputation.responseSpeedScore)}</p>
                      <p className="text-xs text-gray-400 mt-1">Average reply: {donorReputation.avgResponseHours || 0}h</p>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-4">
                      <div className="flex items-center gap-2 text-indigo-700 mb-2">
                        <BadgeCheck className="w-4 h-4" />
                        <p className="text-sm font-semibold">Accuracy</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRating(donorReputation.accuracyScore)}</p>
                      <p className="text-xs text-gray-400 mt-1">{donorReputation.totalReviewedDonations || 0} reviewed donation{donorReputation.totalReviewedDonations === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                    This donor is still building their reputation. Once receivers confirm deliveries and leave feedback, their score will appear here.
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {showRequestForm && (
              <div className="space-y-3">
                <textarea
                  placeholder="Tell the donor why you'd like this book (optional)..."
                  value={requestMsg}
                  onChange={(e: any) => setRequestMsg(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button onClick={handleRequest} disabled={requesting}
                    className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {requesting ? 'Sending...' : 'Send Request'}
                  </button>
                  <button onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showRequestForm && !success && (
              <div className="flex gap-3">
                {canRequest && (
                  <button onClick={() => setShowRequestForm(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    <Heart className="w-5 h-5" /> Request This Book
                  </button>
                )}
                {user && !isOwner && (
                  <Link href={`/dashboard/chat?userId=${book.donorId?._id}&bookId=${book._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <MessageCircle className="w-5 h-5" /> Message Donor
                  </Link>
                )}
                {!user && (
                  <Link href="/auth/login"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Sign in to Request
                  </Link>
                )}
                {book.status !== 'available' && !isOwner && (
                  <div className="flex-1 text-center py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 font-medium">
                    Book not available
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reader Reviews</h2>
              <p className="text-gray-500 mt-1">Only students who received the book can leave a review.</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 min-w-[220px]">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Average title rating</p>
              <div className="flex items-center gap-3">
                <StarDisplay value={reviewsData.summary?.bookRatingAverage || book.ratingsAverage} showValue />
                <span className="text-sm text-gray-500">{reviewsData.summary?.reviewsCount || 0} total</span>
              </div>
            </div>
          </div>

          {reviewsData.reviews?.length ? (
            <div className="grid gap-4">
              {reviewsData.reviews.map((review: any) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-12 text-center text-gray-400">
              No reviews yet for this title. Once a student receives this book, they can leave a star rating and written review.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
