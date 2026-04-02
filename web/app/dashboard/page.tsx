'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle,
  Compass,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Plus,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookCard from '@/components/books/BookCard'
import ReviewForm from '@/components/reviews/ReviewForm'
import StarDisplay from '@/components/reviews/StarDisplay'
import ImpactMap from '@/components/analytics/ImpactMap'
import TrendBars from '@/components/analytics/TrendBars'
import TwoFactorSetupCard from '@/components/auth/TwoFactorSetupCard'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate, formatRating, getStatusColor } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'my-books', label: 'My books', icon: BookOpen },
  { id: 'requests', label: 'Requests', icon: Heart },
  { id: 'donations', label: 'Donations', icon: Truck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function DashboardPage() {
  const { user, fetchMe } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [myBooks, setMyBooks] = useState<any[]>([])
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [donorRequests, setDonorRequests] = useState<any[]>([])
  const [donations, setDonations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [activeReviewDonationId, setActiveReviewDonationId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchAll()
  }, [user, router])

  useEffect(() => {
    const requestedTab = searchParams.get('tab')
    if (requestedTab && tabs.some((item) => item.id === requestedTab)) {
      setTab(requestedTab)
    }
  }, [searchParams])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [booksRes, reqRes, donorReqRes, donRes, notifRes, analyticsRes] = await Promise.all([
        api.get('/books/my-books'),
        api.get('/requests/user'),
        api.get('/requests/donor'),
        api.get('/donations'),
        api.get('/notifications'),
        api.get('/analytics/me'),
      ])
      setMyBooks(booksRes.data)
      setMyRequests(reqRes.data)
      setDonorRequests(donorReqRes.data)
      setDonations(donRes.data)
      setNotifications(notifRes.data)
      setAnalytics(analyticsRes.data)
      await fetchMe()
      setActionError('')
    } catch (error) {
      console.error(error)
      setActionError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const syncRequestInState = (requestId: string, nextStatus: string) => {
    setDonorRequests((prev) => prev.map((req: any) => (
      req._id === requestId ? { ...req, status: nextStatus, responseDate: new Date().toISOString() } : req
    )))

    setMyRequests((prev) => prev.map((req: any) => (
      req._id === requestId ? { ...req, status: nextStatus, responseDate: new Date().toISOString() } : req
    )))

    setMyBooks((prev) => prev.map((book: any) => {
      const relatedRequest = donorRequests.find((req: any) => req._id === requestId) || myRequests.find((req: any) => req._id === requestId)
      if (!relatedRequest?.bookId) return book
      const relatedBookId = typeof relatedRequest.bookId === 'string' ? relatedRequest.bookId : relatedRequest.bookId._id
      if (book._id !== relatedBookId) return book
      return {
        ...book,
        status: nextStatus === 'approved' || nextStatus === 'accepted' ? 'adopted' : 'available',
      }
    }))
  }

  const handleRequestResponse = async (id: string, status: string) => {
    setActionError('')
    setActionMessage('')
    try {
      const normalizedStatus = status === 'accepted' ? 'approved' : status
      const { data } = await api.put(`/requests/${id}/respond`, { status: normalizedStatus })
      const resolvedStatus = data?.status || normalizedStatus

      syncRequestInState(id, resolvedStatus)
      setActionMessage(`Request ${resolvedStatus} successfully.`)
      await fetchAll()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update request')
    }
  }

  const handleDonationStatus = async (id: string, status: string) => {
    setActionError('')
    setActionMessage('')
    try {
      await api.put(`/donations/${id}/status`, { status })
      setActionMessage(status === 'delivered' ? 'Donation marked as delivered.' : 'Receipt confirmed successfully.')
      fetchAll()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update donation status')
    }
  }

  const handleReviewSubmit = async (
    donationId: string,
    payload: { bookRating: number; donorFeedbackRating: number; descriptionAccuracyRating: number; reviewText: string },
    existingReviewId?: string,
  ) => {
    try {
      if (existingReviewId) {
        await api.put(`/reviews/${existingReviewId}`, payload)
        setActionMessage('Private review updated successfully.')
      } else {
        await api.post(`/reviews/donation/${donationId}`, payload)
        setActionMessage('Private review submitted successfully.')
      }
      setActionError('')
      setActiveReviewDonationId(null)
      await fetchAll()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to save review')
      throw new Error(err.response?.data?.message || 'Failed to save review')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/reviews/${reviewId}`)
      setActionMessage('Private review deleted successfully.')
      setActionError('')
      setActiveReviewDonationId(null)
      await fetchAll()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete review')
      throw new Error(err.response?.data?.message || 'Failed to delete review')
    }
  }

  if (!user) return null

  const studentAnalytics = analytics?.studentReadingAnalytics || {
    totalAdoptedBooks: 0,
    adoptedThisYear: 0,
    adoptedThisMonth: 0,
    favouriteCategory: 'Still exploring',
    categoryBreakdown: [],
    topAuthors: [],
    monthlyTrend: [],
    recentBooks: [],
  }

  const donorAnalytics = analytics?.donorImpactAnalytics || {
    totalBooksShared: 0,
    studentsReached: 0,
    citiesReached: 0,
    favouriteSharedCategory: 'No completed shares yet',
    cityBreakdown: [],
    categoryBreakdown: [],
    monthlyTrend: [],
    impactMap: [],
    recentRecipients: [],
  }

  const stats = [
    { label: 'Books donated', value: myBooks.length, icon: BookOpen },
    { label: 'Requests sent', value: myRequests.length, icon: Heart },
    { label: 'Books adopted', value: donations.filter((item: any) => item.receiverId?._id === user?._id).length, icon: CheckCircle },
    { label: 'Unread alerts', value: notifications.filter((item: any) => !item.isRead).length, icon: Bell },
  ]

  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  const quickActionCards = useMemo(
    () => [
      {
        title: 'Start a donation',
        description: 'Create a polished listing with cover preview, metadata, and stronger trust signals.',
        href: '/books/donate',
        icon: Plus,
      },
      {
        title: 'Browse the catalog',
        description: 'Jump into curated categories and discover which books are trending right now.',
        href: '/books',
        icon: Compass,
      },
      {
        title: 'Open messages',
        description: 'Continue donor or reader conversations from the new chat workspace.',
        href: '/dashboard/chat',
        icon: MessageCircle,
      },
    ],
    []
  )

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <section className="surface-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{user.role} workspace</p>
                <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Welcome back, {user.name.split(' ')[0]}.</h1>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{user.location || 'Add your location'} · Premium dashboard with analytics, trust, and messaging.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/chat"><MessageCircle className="mr-2 h-4 w-4" /> Chat</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/books/donate"><Plus className="mr-2 h-4 w-4" /> Donate a book</Link>
              </Button>
            </div>
          </div>

          {!!user.donorReputation?.overallScore ? (
            <div className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Badge variant="secondary" className="rounded-full bg-white/70 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Donor reputation live
                  </Badge>
                  <h2 className="mt-3 text-xl font-semibold">Your donor score is {formatRating(user.donorReputation.overallScore)} / 5</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Powered by response speed, receiver feedback, and book description accuracy.</p>
                </div>
                <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[380px]">
                  <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Response</p>
                    <p className="mt-2 text-lg font-semibold">{formatRating(user.donorReputation.responseSpeedScore)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Accuracy</p>
                    <p className="mt-2 text-lg font-semibold">{formatRating(user.donorReputation.accuracyScore)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Feedback</p>
                    <p className="mt-2 text-lg font-semibold">{formatRating(user.donorReputation.receiverFeedbackScore)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {actionMessage || actionError ? (
          <div className={cn('mt-6 rounded-[1.5rem] border px-4 py-3 text-sm', actionMessage ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300')}>
            {actionMessage || actionError}
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-28 h-fit">
            <Card className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle className="text-base">Workspace</CardTitle>
                <CardDescription>Move between dashboard sections with a clearer information hierarchy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn('flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition', tab === item.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground')}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="rounded-[1.5rem] shadow-none">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="text-xl font-semibold">{item.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </aside>

          <section className="space-y-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-44 w-full rounded-[1.75rem]" />)}
              </div>
            ) : null}

            {!loading && tab === 'overview' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {stats.map((item) => {
                    const Icon = item.icon
                    return (
                      <Card key={item.label} className="rounded-[1.75rem]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                  {quickActionCards.map((item) => {
                    const Icon = item.icon
                    return (
                      <Card key={item.title} className="rounded-[1.75rem]">
                        <CardContent className="p-6">
                          <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                          <Button asChild variant="outline" className="mt-5 rounded-full">
                            <Link href={item.href}>Open</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className="rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>Incoming requests</CardTitle>
                      <CardDescription>Respond faster with a cleaner action list for donors.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {donorRequests.length === 0 ? (
                        <EmptyState icon={Heart} title="No incoming requests yet" description="When students request one of your books, the request will appear here." className="border-0 shadow-none" />
                      ) : (
                        <div className="space-y-3">
                          {donorRequests.slice(0, 4).map((req: any) => (
                            <div key={req._id} className="rounded-[1.5rem] border border-border/70 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium">{req.bookId?.title}</p>
                                  <p className="text-sm text-muted-foreground">Requested by {req.requesterId?.name} · {formatDate(req.requestDate)}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getStatusColor(req.status))}>{req.status}</span>
                                  {(req.status === 'pending') ? (
                                    <>
                                      <Button size="sm" className="rounded-full" onClick={() => handleRequestResponse(req._id, 'approved')}>Approve</Button>
                                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleRequestResponse(req._id, 'rejected')}>Reject</Button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>Latest notifications</CardTitle>
                      <CardDescription>Unread activity across requests, donations, and reviews.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {notifications.length === 0 ? (
                        <EmptyState icon={Bell} title="No notifications yet" description="When important activity happens, the feed will light up here." className="border-0 shadow-none" />
                      ) : (
                        <div className="space-y-3">
                          {notifications.slice(0, 5).map((item: any) => (
                            <div key={item._id} className={cn('rounded-[1.5rem] border p-4 text-sm', item.isRead ? 'border-border/70 bg-background/60' : 'border-primary/20 bg-primary/5')}>
                              <p>{item.message}</p>
                              <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}

            {!loading && tab === 'analytics' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-[1.75rem]"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Books adopted</p><p className="mt-2 text-3xl font-semibold">{studentAnalytics.totalAdoptedBooks}</p></CardContent></Card>
                  <Card className="rounded-[1.75rem]"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Adopted this year</p><p className="mt-2 text-3xl font-semibold">{studentAnalytics.adoptedThisYear}</p></CardContent></Card>
                  <Card className="rounded-[1.75rem]"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Books shared</p><p className="mt-2 text-3xl font-semibold">{donorAnalytics.totalBooksShared}</p></CardContent></Card>
                  <Card className="rounded-[1.75rem]"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Students reached</p><p className="mt-2 text-3xl font-semibold">{donorAnalytics.studentsReached}</p></CardContent></Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <TrendBars title="Reading trend" subtitle="Books adopted over time" data={studentAnalytics.monthlyTrend || []} />
                  <TrendBars title="Donation trend" subtitle="Books shared over time" data={donorAnalytics.monthlyTrend || []} />
                  <ImpactMap points={donorAnalytics.impactMap || []} />
                  <Card className="rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>Insight snapshot</CardTitle>
                      <CardDescription>Categories and preferences based on your current activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-[1.5rem] bg-muted/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Favourite reading category</p>
                        <p className="mt-2 text-lg font-semibold">{studentAnalytics.favouriteCategory}</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-muted/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Favourite shared category</p>
                        <p className="mt-2 text-lg font-semibold">{donorAnalytics.favouriteSharedCategory}</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-muted/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cities reached</p>
                        <p className="mt-2 text-lg font-semibold">{donorAnalytics.citiesReached}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}

            {!loading && tab === 'my-books' ? (
              myBooks.length === 0 ? (
                <EmptyState icon={BookOpen} title="No listings yet" description="Publish your first book to see polished cards, request activity, and analytics here." action={<Button asChild><Link href="/books/donate">Create a listing</Link></Button>} />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {myBooks.map((book: any) => <BookCard key={book._id} book={book} />)}
                </div>
              )
            ) : null}

            {!loading && tab === 'requests' ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-[1.75rem]">
                  <CardHeader>
                    <CardTitle>Incoming requests</CardTitle>
                    <CardDescription>Requests received for books you listed.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {donorRequests.length === 0 ? (
                      <EmptyState icon={Heart} title="No incoming requests" description="Once a reader requests one of your books, it will appear here for approval." className="border-0 shadow-none" />
                    ) : (
                      <div className="space-y-3">
                        {donorRequests.map((req: any) => (
                          <div key={req._id} className="rounded-[1.5rem] border border-border/70 p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium">{req.bookId?.title}</p>
                                  <p className="text-sm text-muted-foreground">{req.requesterId?.name} · {formatDate(req.requestDate)}</p>
                                </div>
                                <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getStatusColor(req.status))}>{req.status}</span>
                              </div>
                              {req.message ? <p className="text-sm text-muted-foreground">“{req.message}”</p> : null}
                              {(req.status === 'pending') ? (
                                <div className="flex gap-2">
                                  <Button size="sm" className="rounded-full" onClick={() => handleRequestResponse(req._id, 'approved')}>Approve</Button>
                                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleRequestResponse(req._id, 'rejected')}>Reject</Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[1.75rem]">
                  <CardHeader>
                    <CardTitle>My sent requests</CardTitle>
                    <CardDescription>Books you have requested from donors.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myRequests.length === 0 ? (
                      <EmptyState icon={Compass} title="No requests sent" description="Explore the catalog and request a book to start tracking the exchange journey." className="border-0 shadow-none" />
                    ) : (
                      <div className="space-y-3">
                        {myRequests.map((req: any) => (
                          <div key={req._id} className="rounded-[1.5rem] border border-border/70 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{req.bookId?.title}</p>
                                <p className="text-sm text-muted-foreground">{req.bookId?.author} · {formatDate(req.requestDate)}</p>
                              </div>
                              <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getStatusColor(req.status))}>{req.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!loading && tab === 'donations' ? (
              donations.length === 0 ? (
                <EmptyState icon={Truck} title="No donations yet" description="Delivered exchanges will appear here with status actions and private review controls." />
              ) : (
                <div className="space-y-4">
                  {donations.map((don: any) => {
                    const isDonor = don.donorId?._id === user?._id
                    const isReceiver = don.receiverId?._id === user?._id
                    const canMarkDelivered = isDonor && don.status === 'pending'
                    const canConfirmReceipt = isReceiver && don.status === 'delivered'
                    const canManagePrivateReview = isReceiver && ['delivered', 'confirmed'].includes(don.status)

                    return (
                      <Card key={don._id} className="rounded-[1.75rem]">
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-lg font-semibold">{don.bookId?.title}</p>
                                <p className="text-sm text-muted-foreground">{isDonor ? `Given to ${don.receiverId?.name}` : `Received from ${don.donorId?.name}`}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatDate(don.donationDate)} · {don.deliveryMethod}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getStatusColor(don.status))}>{don.status}</span>
                                {canMarkDelivered ? <Button size="sm" className="rounded-full" onClick={() => handleDonationStatus(don._id, 'delivered')}><Truck className="mr-1 h-4 w-4" /> Mark delivered</Button> : null}
                                {canConfirmReceipt ? <Button size="sm" className="rounded-full" onClick={() => handleDonationStatus(don._id, 'confirmed')}><CheckCircle className="mr-1 h-4 w-4" /> Confirm receipt</Button> : null}
                                {canManagePrivateReview ? (
                                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setActiveReviewDonationId(activeReviewDonationId === don._id ? null : don._id)}>
                                    <Star className="mr-1 h-4 w-4" /> {activeReviewDonationId === don._id ? 'Hide review form' : don.reviewId ? 'Edit private review' : 'Leave private review'}
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {don.reviewId ? (
                              <div className="rounded-[1.5rem] bg-muted/70 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold">Your submitted review</p>
                                    <p className="text-xs text-muted-foreground">Added on {formatDate(don.reviewId.createdAt)}</p>
                                  </div>
                                  <StarDisplay value={don.reviewId.bookRating} showValue />
                                </div>
                                {don.reviewId.reviewText ? <p className="mt-3 text-sm text-muted-foreground">“{don.reviewId.reviewText}”</p> : null}
                              </div>
                            ) : null}

                            {activeReviewDonationId === don._id && canManagePrivateReview ? (
                              <ReviewForm
                                mode="private"
                                initialValues={don.reviewId || undefined}
                                onSubmit={(payload) => handleReviewSubmit(don._id, payload, don.reviewId?._id)}
                                onDelete={don.reviewId ? () => handleDeleteReview(don.reviewId._id) : undefined}
                                onCancel={() => setActiveReviewDonationId(null)}
                                submitLabel={don.reviewId ? 'Update private review' : 'Submit private review'}
                                deleteLabel="Delete private review"
                              />
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            ) : null}

            {!loading && tab === 'notifications' ? (
              notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" description="The redesigned activity feed will show requests, donation updates, and safety alerts here." />
              ) : (
                <div className="space-y-3">
                  {notifications.map((item: any) => (
                    <Card key={item._id} className={cn('rounded-[1.5rem]', item.isRead ? '' : 'border-primary/20 bg-primary/5')}>
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className={cn('rounded-2xl p-2', item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm leading-7">{item.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : null}

            {!loading && tab === 'security' ? (
              <div className="space-y-6">
                <TwoFactorSetupCard user={user} onUpdated={fetchAll} />
                <Card className="rounded-[1.75rem]">
                  <CardHeader>
                    <CardTitle>Trust & safety shortcuts</CardTitle>
                    <CardDescription>Use these tools whenever you notice suspicious activity or want stronger account protection.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    {[
                      { title: 'Report fake listings', desc: 'Open any book page and use the report action to alert admins quickly.' },
                      { title: 'Secure sign-in', desc: 'Enable email or SMS OTP to add a second step every time you log in.' },
                      { title: 'Faster onboarding', desc: 'Use Google or Facebook login when OAuth is configured for your deployment.' },
                    ].map((item) => (
                      <div key={item.title} className="rounded-[1.5rem] bg-muted/70 p-4">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  )
}
