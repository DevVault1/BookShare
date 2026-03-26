'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Heart,
  CheckCircle,
  Plus,
  Bell,
  Truck,
  ShieldCheck,
  Star,
  BarChart3,
  Compass,
  MapPinned,
  MessageCircle,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookCard from '@/components/books/BookCard'
import ReviewForm from '@/components/reviews/ReviewForm'
import StarDisplay from '@/components/reviews/StarDisplay'
import ImpactMap from '@/components/analytics/ImpactMap'
import TrendBars from '@/components/analytics/TrendBars'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn, getStatusColor, formatDate, formatRating } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const { user, fetchMe } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState('overview')
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
    } catch (err) {
      console.error(err)
      setActionError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResponse = async (id: string, status: string) => {
    setActionError('')
    setActionMessage('')
    try {
      await api.put(`/requests/${id}/respond`, { status })
      setActionMessage(`Request ${status} successfully.`)
      fetchAll()
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
    { label: 'Books Donated', value: myBooks.length, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Requests Sent', value: myRequests.length, icon: Heart, color: 'bg-rose-50 text-rose-600' },
    { label: 'Books Adopted', value: donations.filter((d: any) => d.receiverId?._id === user?._id).length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Reviews Pending', value: donations.filter((d: any) => d.receiverId?._id === user?._id && ['delivered', 'confirmed'].includes(d.status) && !d.reviewId).length, icon: Star, color: 'bg-amber-50 text-amber-600' },
  ]

  const tabs = ['overview', 'analytics', 'my-books', 'requests', 'donations', 'notifications']
  const unreadNotifications = notifications.filter((n: any) => !n.isRead).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 mt-1 capitalize">{user?.role} account · {user?.location || 'No location set'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/chat">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/books/donate">
                <Plus className="mr-2 h-4 w-4" /> Donate a Book
              </Link>
            </Button>
          </div>
        </div>

        {!!user?.donorReputation?.overallScore && (
          <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 inline-flex gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <ShieldCheck className="h-4 w-4" /> Donor reputation live
                </Badge>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your current donor score is {formatRating(user.donorReputation.overallScore)} / 5</h2>
                <p className="text-sm text-gray-500 mt-1">Calculated from response speed, receiver feedback, and how accurately your book descriptions match reality.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm min-w-full md:min-w-[360px]">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-3">
                  <p className="text-gray-500 mb-1">Response</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatRating(user.donorReputation.responseSpeedScore)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-3">
                  <p className="text-gray-500 mb-1">Accuracy</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatRating(user.donorReputation.accuracyScore)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-3">
                  <p className="text-gray-500 mb-1">Feedback</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatRating(user.donorReputation.receiverFeedbackScore)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(actionMessage || actionError) && (
          <div className={cn('mb-6 rounded-2xl px-4 py-3 text-sm border', actionMessage ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
            {actionMessage || actionError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="mt-0.5 text-sm text-gray-500">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-8">
          <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl p-1">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t.replace('-', ' ')}
                {t === 'notifications' && unreadNotifications > 0 ? (
                  <Badge variant="secondary" className="ml-2">{unreadNotifications}</Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-60 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                      <div>
                        <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-800 hover:bg-blue-100">Reading analytics</Badge>
                        <CardTitle className="text-xl">You've adopted {studentAnalytics.adoptedThisYear} books this year</CardTitle>
                        <CardDescription className="mt-2">Favourite category: <span className="font-semibold text-foreground">{studentAnalytics.favouriteCategory}</span></CardDescription>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Compass className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">Total adopted</p><p className="text-xl font-bold">{studentAnalytics.totalAdoptedBooks}</p></CardContent></Card>
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">This month</p><p className="text-xl font-bold">{studentAnalytics.adoptedThisMonth}</p></CardContent></Card>
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">Top authors</p><p className="text-xl font-bold">{studentAnalytics.topAuthors.length}</p></CardContent></Card>
                      </div>
                      <div className="mt-4">
                        <TrendBars title="Adoptions this year" subtitle="Monthly completed adoptions" data={studentAnalytics.monthlyTrend} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                      <div>
                        <Badge variant="secondary" className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Donor impact</Badge>
                        <CardTitle className="text-xl">Your books have reached {donorAnalytics.studentsReached} students across {donorAnalytics.citiesReached} cities</CardTitle>
                        <CardDescription className="mt-2">Favourite shared category: <span className="font-semibold text-foreground">{donorAnalytics.favouriteSharedCategory}</span></CardDescription>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <MapPinned className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">Books shared</p><p className="text-xl font-bold">{donorAnalytics.totalBooksShared}</p></CardContent></Card>
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">Students</p><p className="text-xl font-bold">{donorAnalytics.studentsReached}</p></CardContent></Card>
                        <Card className="bg-muted/40 shadow-none"><CardContent className="px-3 py-3"><p className="text-muted-foreground">Cities</p><p className="text-xl font-bold">{donorAnalytics.citiesReached}</p></CardContent></Card>
                      </div>
                      <ImpactMap points={donorAnalytics.impactMap} />
                    </CardContent>
                  </Card>
                </div>

                {donorRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏳ Pending Requests for Your Books</h2>
                    <div className="space-y-3">
                      {donorRequests.filter((r: any) => r.status === 'pending').slice(0, 3).map((req: any) => (
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{req.requesterId?.name} wants <span className="text-blue-600">{req.bookId?.title}</span></p>
                            {req.message && <p className="text-sm text-gray-500 mt-1">“{req.message}”</p>}
                            <p className="text-xs text-gray-400 mt-1">{formatDate(req.requestDate)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRequestResponse(req._id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                            <button onClick={() => handleRequestResponse(req._id, 'rejected')} className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📚 Your Recent Books</h2>
                  {myBooks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No books donated yet. <Link href="/books/donate" className="text-blue-600 hover:underline">Donate your first book!</Link></p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {myBooks.slice(0, 4).map((book: any) => <BookCard key={book._id} book={book} />)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">User reading analytics</CardTitle>
                            <CardDescription>Track what you've adopted and what subjects you lean toward most.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <Card className="bg-muted/40 shadow-none"><CardContent className="px-4 py-4"><p className="text-sm text-muted-foreground">You've adopted</p><p className="text-3xl font-bold">{studentAnalytics.adoptedThisYear}</p><p className="mt-1 text-xs text-muted-foreground">books this year</p></CardContent></Card>
                          <Card className="bg-muted/40 shadow-none"><CardContent className="px-4 py-4"><p className="text-sm text-muted-foreground">Favourite category</p><p className="text-xl font-bold">{studentAnalytics.favouriteCategory}</p><p className="mt-1 text-xs text-muted-foreground">based on your completed adoptions</p></CardContent></Card>
                        </div>
                        <TrendBars title="Reading trend" subtitle="Completed adoptions by month" data={studentAnalytics.monthlyTrend} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Category breakdown</CardTitle>
                        <CardDescription>Your top adopted subjects at a glance.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {studentAnalytics.categoryBreakdown.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No completed adoptions yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {studentAnalytics.categoryBreakdown.map((item: any) => {
                              const width = Math.min(100, (item.count / Math.max(studentAnalytics.totalAdoptedBooks, 1)) * 100)
                              return (
                                <div key={item.label}>
                                  <div className="mb-1 flex items-center justify-between text-sm">
                                    <span>{item.label}</span>
                                    <span className="text-muted-foreground">{item.count}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <MapPinned className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Donor impact dashboard</CardTitle>
                            <CardDescription>See how far your donated books travel and who they reach.</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 grid grid-cols-3 gap-3">
                          <Card className="bg-muted/40 shadow-none"><CardContent className="px-4 py-4"><p className="text-sm text-muted-foreground">Books shared</p><p className="text-2xl font-bold">{donorAnalytics.totalBooksShared}</p></CardContent></Card>
                          <Card className="bg-muted/40 shadow-none"><CardContent className="px-4 py-4"><p className="text-sm text-muted-foreground">Students reached</p><p className="text-2xl font-bold">{donorAnalytics.studentsReached}</p></CardContent></Card>
                          <Card className="bg-muted/40 shadow-none"><CardContent className="px-4 py-4"><p className="text-sm text-muted-foreground">Cities reached</p><p className="text-2xl font-bold">{donorAnalytics.citiesReached}</p></CardContent></Card>
                        </div>
                        <ImpactMap points={donorAnalytics.impactMap} />
                      </CardContent>
                    </Card>

                    <TrendBars title="Sharing trend" subtitle="Completed deliveries by month" data={donorAnalytics.monthlyTrend} />

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cities and latest recipients</CardTitle>
                        <CardDescription>Where your reach is strongest and who received books most recently.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            {donorAnalytics.cityBreakdown.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No city data yet.</p>
                            ) : donorAnalytics.cityBreakdown.slice(0, 5).map((item: any) => (
                              <Card key={item.label} className="bg-muted/40 shadow-none">
                                <CardContent className="flex items-center justify-between px-4 py-3">
                                  <span className="text-sm">{item.label}</span>
                                  <span className="text-sm font-semibold">{item.count}</span>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          <div className="space-y-3">
                            {donorAnalytics.recentRecipients.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No completed deliveries yet.</p>
                            ) : donorAnalytics.recentRecipients.map((item: any) => (
                              <Card key={item.donationId} className="bg-muted/40 shadow-none">
                                <CardContent className="px-4 py-3">
                                  <p className="font-medium">{item.recipientName}</p>
                                  <p className="text-sm text-muted-foreground">{item.title}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{item.city} · {formatDate(item.deliveredAt)}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {tab === 'my-books' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Donated Books ({myBooks.length})</h2>
                  <Link href="/books/donate" className="text-sm text-blue-600 hover:underline">+ Add New</Link>
                </div>
                {myBooks.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>You haven't donated any books yet.</p>
                    <Link href="/books/donate" className="mt-3 inline-block text-blue-600 hover:underline font-medium">Donate your first book</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {myBooks.map((book: any) => <BookCard key={book._id} book={book} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'requests' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests on Your Books</h2>
                  {donorRequests.length === 0 ? <p className="text-gray-400">No requests yet.</p> : (
                    <div className="space-y-3">
                      {donorRequests.map((req: any) => (
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white"><span className="text-blue-600">{req.requesterId?.name}</span> → {req.bookId?.title}</p>
                              {req.message && <p className="text-sm text-gray-500 mt-1 italic">“{req.message}”</p>}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(req.requestDate)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getStatusColor(req.status))}>{req.status}</span>
                              {req.status === 'pending' && (
                                <>
                                  <button onClick={() => handleRequestResponse(req._id, 'approved')} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Approve</button>
                                  <button onClick={() => handleRequestResponse(req._id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200">Decline</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Book Requests</h2>
                  {myRequests.length === 0 ? <p className="text-gray-400">You haven't requested any books.</p> : (
                    <div className="space-y-3">
                      {myRequests.map((req: any) => (
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {req.bookId?.image && <img src={req.bookId.image} alt={req.bookId.title} className="w-12 h-16 object-cover rounded-lg" />}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{req.bookId?.title}</p>
                              <p className="text-sm text-gray-500">{req.bookId?.author}</p>
                              <p className="text-xs text-gray-400">{formatDate(req.requestDate)}</p>
                            </div>
                          </div>
                          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getStatusColor(req.status))}>{req.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'donations' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donation History ({donations.length})</h2>
                {donations.length === 0 ? <p className="text-gray-400 text-center py-16">No donations yet.</p> : (
                  <div className="space-y-4">
                    {donations.map((don: any) => {
                      const isDonor = don.donorId?._id === user?._id
                      const isReceiver = don.receiverId?._id === user?._id
                      const canMarkDelivered = isDonor && don.status === 'pending'
                      const canConfirmReceipt = isReceiver && don.status === 'delivered'
                      const canManagePrivateReview = isReceiver && ['delivered', 'confirmed'].includes(don.status)

                      return (
                        <div key={don._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{don.bookId?.title}</p>
                              <p className="text-sm text-gray-500">{isDonor ? `Given to ${don.receiverId?.name}` : `Received from ${don.donorId?.name}`}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(don.donationDate)} · {don.deliveryMethod}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getStatusColor(don.status))}>{don.status}</span>
                              {canMarkDelivered && (
                                <button onClick={() => handleDonationStatus(don._id, 'delivered')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                  <Truck className="w-4 h-4" /> Mark delivered
                                </button>
                              )}
                              {canConfirmReceipt && (
                                <button onClick={() => handleDonationStatus(don._id, 'confirmed')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                                  <CheckCircle className="w-4 h-4" /> Confirm receipt
                                </button>
                              )}
                              {canManagePrivateReview && (
                                <button onClick={() => setActiveReviewDonationId(activeReviewDonationId === don._id ? null : don._id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-lg hover:bg-amber-200 transition-colors">
                                  <Star className="w-4 h-4" /> {activeReviewDonationId === don._id ? 'Hide review form' : don.reviewId ? 'Edit private review' : 'Leave private review'}
                                </button>
                              )}
                            </div>
                          </div>

                          {don.reviewId && (
                            <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4">
                              <div className="flex flex-wrap items-center gap-3 justify-between mb-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Your submitted review</p>
                                  <p className="text-xs text-gray-400">Added on {formatDate(don.reviewId.createdAt)}</p>
                                </div>
                                <StarDisplay value={don.reviewId.bookRating} showValue />
                              </div>
                              {don.reviewId.reviewText && <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">“{don.reviewId.reviewText}”</p>}
                              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-white dark:bg-gray-900 rounded-xl px-3 py-3">
                                  <p className="text-gray-500 mb-1">Donor feedback</p>
                                  <StarDisplay value={don.reviewId.donorFeedbackRating} size="sm" showValue />
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-xl px-3 py-3">
                                  <p className="text-gray-500 mb-1">Description accuracy</p>
                                  <StarDisplay value={don.reviewId.descriptionAccuracyRating} size="sm" showValue />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeReviewDonationId === don._id && canManagePrivateReview && (
                            <div className="mt-4">
                              <ReviewForm
                                mode="private"
                                initialValues={don.reviewId || undefined}
                                onSubmit={(payload) => handleReviewSubmit(don._id, payload, don.reviewId?._id)}
                                onDelete={don.reviewId ? () => handleDeleteReview(don.reviewId._id) : undefined}
                                onCancel={() => setActiveReviewDonationId(null)}
                                submitLabel={don.reviewId ? 'Update private review' : 'Submit private review'}
                                deleteLabel="Delete private review"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
                {notifications.length === 0 ? <p className="text-gray-400 text-center py-16">No notifications yet.</p> : (
                  <div className="space-y-2">
                    {notifications.map((n: any) => (
                      <div key={n._id} className={cn('bg-white dark:bg-gray-900 rounded-xl p-4 border transition-colors', n.isRead ? 'border-gray-100 dark:border-gray-800' : 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10')}>
                        <div className="flex items-start gap-3">
                          <Bell className={cn('w-5 h-5 mt-0.5 flex-shrink-0', n.isRead ? 'text-gray-400' : 'text-blue-600')} />
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
