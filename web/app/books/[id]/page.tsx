"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Flag, MapPin, MessageCircle, ShieldCheck, Star, User } from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate, formatRating, getConditionColor, getStatusColor } from '@/lib/utils'
import StarDisplay from '@/components/reviews/StarDisplay'
import ReviewCard from '@/components/reviews/ReviewCard'
import ReviewForm from '@/components/reviews/ReviewForm'
import ReportDialog from '@/components/safety/ReportDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const emptyReviewsState = {
  reviews: [],
  myReview: null,
  summary: {
    bookRatingAverage: 0,
    reviewsCount: 0,
  },
  total: 0,
  page: 1,
  pages: 1,
}

export default function BookDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [book, setBook] = useState<any>(null)
  const [reviewsData, setReviewsData] = useState<any>(emptyReviewsState)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestMsg, setRequestMsg] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showPublicReviewForm, setShowPublicReviewForm] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportContext, setReportContext] = useState<{ targetType: 'book' | 'user'; targetId?: string; targetLabel: string; initialCategory: string } | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchBook = async () => {
    const { data } = await api.get(`/books/${id}`)
    setBook(data)
    return data
  }

  const fetchReviews = async () => {
    if (!token) {
      setReviewsData(emptyReviewsState)
      return
    }
    setReviewsLoading(true)
    try {
      const { data } = await api.get(`/reviews/public/book/${id}`)
      setReviewsData(data)
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        await fetchBook()
      } catch {
        router.push('/books')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  useEffect(() => {
    fetchReviews().catch(() => setReviewsData(emptyReviewsState))
  }, [id, token])

  const handleRequest = async () => {
    if (!user) return router.push('/auth/login')
    setRequesting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/requests', { bookId: id, message: requestMsg })
      setSuccess('Request sent successfully.')
      setShowRequestForm(false)
      setRequestMsg('')
      await fetchBook()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  const handlePublicReviewSubmit = async (payload: any) => {
    try {
      if (reviewsData.myReview?._id) {
        await api.put(`/reviews/${reviewsData.myReview._id}`, payload)
        setSuccess('Your public review was updated successfully.')
      } else {
        await api.post(`/reviews/public/book/${id}`, payload)
        setSuccess('Your public review was published successfully.')
      }
      setError('')
      setShowPublicReviewForm(false)
      await Promise.all([fetchBook(), fetchReviews()])
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save public review'
      setError(message)
      throw new Error(message)
    }
  }

  const handleDeletePublicReview = async () => {
    if (!reviewsData.myReview?._id) return
    try {
      await api.delete(`/reviews/${reviewsData.myReview._id}`)
      setSuccess('Your public review was deleted successfully.')
      setError('')
      setShowPublicReviewForm(false)
      await Promise.all([fetchBook(), fetchReviews()])
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete public review'
      setError(message)
      throw new Error(message)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-52 w-full rounded-[2rem]" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!book) return null

  const isOwner = user?._id === book.donorId?._id
  const canRequest = !!user && !isOwner && book.status === 'available'
  const donorReputation = book.donorId?.donorReputation
  const averageRating = reviewsData.summary?.bookRatingAverage || book.ratingsAverage || 0
  const reviewsCount = reviewsData.summary?.reviewsCount || book.ratingsCount || 0

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <Button variant="ghost" asChild className="mb-4 rounded-full px-0">
          <Link href="/books"><ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog</Link>
        </Button>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr] xl:grid-cols-[420px_1fr_320px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden rounded-[2rem]">
              <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/10 to-violet-500/10">
                {book.image ? (
                  <img src={book.image} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-primary/40">
                    <BookOpen className="h-20 w-20" />
                  </div>
                )}
                <div className="absolute inset-x-4 top-4 flex flex-wrap gap-2">
                  <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getConditionColor(book.condition))}>{book.condition}</span>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getStatusColor(book.status))}>{book.status}</span>
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/30 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Public rating</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <StarDisplay value={averageRating} showValue />
                      <p className="mt-2 text-sm text-muted-foreground">{reviewsCount} review{reviewsCount === 1 ? '' : 's'}</p>
                    </div>
                    {donorReputation?.overallScore ? (
                      <Badge variant="secondary" className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {formatRating(donorReputation.overallScore)} donor trust
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 xl:col-span-1">
            <Card className="rounded-[2rem]">
              <CardContent className="p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{book.category}</p>
                <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">{book.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground">by {book.author}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {book.location || 'Location shared after request'}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                    <Star className="h-4 w-4 text-primary" /> {reviewsCount ? `${formatRating(averageRating)} average` : 'No ratings yet'}
                  </div>
                </div>

                {book.description ? <p className="mt-6 text-sm leading-8 text-muted-foreground">{book.description}</p> : null}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Language', value: book.language || 'English' },
                    { label: 'Pages', value: book.pages || 'N/A' },
                    { label: 'ISBN', value: book.isbn || 'N/A' },
                    { label: 'Published', value: book.publishedYear || 'N/A' },
                    { label: 'Listed', value: formatDate(book.createdAt) },
                    { label: 'Condition', value: book.condition },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.5rem] bg-muted/70 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>About the donor</CardTitle>
                <CardDescription>Trust signals and direct communication for safer exchanges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-[1.5rem] bg-muted/60 p-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    {book.donorId?.profileImage ? <img src={book.donorId.profileImage} alt={book.donorId.name} className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{book.donorId?.name || 'Book donor'}</p>
                    <p className="text-sm text-muted-foreground">{book.location || 'Community member'}</p>
                  </div>
                </div>
                {donorReputation?.overallScore ? (
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Donor reputation score: <span className="font-semibold">{formatRating(donorReputation.overallScore)} / 5</span>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                    This donor is still building reputation feedback.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 xl:sticky xl:top-28 h-fit">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
                <CardDescription>Request the book, contact the donor, or leave a review if you have already interacted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRequest ? (
                  <Button onClick={() => setShowRequestForm(true)} className="w-full rounded-xl">Request this book</Button>
                ) : !user ? (
                  <Button asChild className="w-full rounded-xl">
                    <Link href="/auth/login">Sign in to request</Link>
                  </Button>
                ) : isOwner ? (
                  <Button variant="outline" className="w-full rounded-xl" disabled>You own this listing</Button>
                ) : (
                  <Button variant="outline" className="w-full rounded-xl" disabled>Currently unavailable</Button>
                )}

                {!isOwner && user && book.donorId?._id ? (
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href={`/dashboard/chat?userId=${book.donorId._id}&bookId=${book._id}`}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Message donor
                    </Link>
                  </Button>
                ) : null}

                {token ? (
                  <Button variant="ghost" onClick={() => setShowPublicReviewForm(true)} className="w-full rounded-xl">
                    {reviewsData.myReview ? 'Edit your review' : 'Leave a public review'}
                  </Button>
                ) : null}

                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                  onClick={() => {
                    setReportContext({
                      targetType: 'book',
                      targetId: book._id,
                      targetLabel: `book: ${book.title}`,
                      initialCategory: 'fake_listing',
                    })
                    setShowReportDialog(true)
                  }}
                >
                  <Flag className="mr-2 h-4 w-4" /> Report listing
                </Button>
              </CardContent>
            </Card>

            {success ? <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div> : null}
            {error ? <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}
          </motion.div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Public reviews</CardTitle>
              <CardDescription>Community feedback that helps future readers decide with confidence.</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full rounded-[1.5rem]" />)}
                </div>
              ) : reviewsData.reviews?.length ? (
                <div className="space-y-4">
                  {reviewsData.reviews.map((review: any) => <ReviewCard key={review._id} review={review} />)}
                </div>
              ) : (
                <EmptyState icon={Star} title="No reviews yet" description="Be the first reader to leave a public review once you have interacted with this listing." className="border-0 shadow-none" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Review summary</CardTitle>
              <CardDescription>A quick snapshot of current public sentiment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] bg-muted/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Average rating</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <StarDisplay value={averageRating} showValue />
                  <p className="text-sm text-muted-foreground">{reviewsCount} total</p>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-muted/70 p-4 text-sm leading-7 text-muted-foreground">
                Review quality improves donor trust and helps future readers understand the true condition of the book.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request {book.title}</DialogTitle>
            <DialogDescription>Introduce yourself and mention how you plan to use the book.</DialogDescription>
          </DialogHeader>
          <Textarea value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)} rows={5} placeholder="Hi! I would love to request this book because..." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting || !requestMsg.trim()}>{requesting ? 'Sending...' : 'Send request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPublicReviewForm} onOpenChange={setShowPublicReviewForm}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          <ReviewForm
            mode="public"
            initialValues={reviewsData.myReview || undefined}
            onSubmit={handlePublicReviewSubmit}
            onDelete={reviewsData.myReview ? handleDeletePublicReview : undefined}
            onCancel={() => setShowPublicReviewForm(false)}
            submitLabel={reviewsData.myReview ? 'Update public review' : 'Publish public review'}
            deleteLabel="Delete public review"
          />
        </DialogContent>
      </Dialog>

      {reportContext ? (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          targetType={reportContext.targetType}
          targetId={reportContext.targetId}
          targetLabel={reportContext.targetLabel}
          initialCategory={reportContext.initialCategory}
          onSubmitted={(message) => setSuccess(message)}
        />
      ) : null}

      <Footer />
    </div>
  )
}
