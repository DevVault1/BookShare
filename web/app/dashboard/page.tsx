'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Heart, CheckCircle, Clock, Plus, MessageCircle, Bell } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookCard from '@/components/books/BookCard'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn, getStatusColor, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [myBooks, setMyBooks] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [donorRequests, setDonorRequests] = useState([])
  const [donations, setDonations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [booksRes, reqRes, donorReqRes, donRes, notifRes] = await Promise.all([
        api.get('/books/my-books'),
        api.get('/requests/user'),
        api.get('/requests/donor'),
        api.get('/donations'),
        api.get('/notifications'),
      ])
      setMyBooks(booksRes.data)
      setMyRequests(reqRes.data)
      setDonorRequests(donorReqRes.data)
      setDonations(donRes.data)
      setNotifications(notifRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleRequestResponse = async (id: string, status: string) => {
    try {
      await api.put(`/requests/${id}/respond`, { status })
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const stats = [
    { label: 'Books Donated', value: myBooks.length, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Requests Sent', value: myRequests.length, icon: Heart, color: 'bg-rose-50 text-rose-600' },
    { label: 'Books Adopted', value: donations.filter((d: any) => d.receiverId?._id === user?._id).length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Pending', value: donorRequests.filter((r: any) => r.status === 'pending').length, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  ]

  const tabs = ['overview', 'my-books', 'requests', 'donations', 'notifications']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Welcome */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Hello, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1 capitalize">{user?.role} account · {user?.location || 'No location set'}</p>
          </div>
          <Link href="/books/donate"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Donate a Book
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors', tab === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-60 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {donorRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏳ Pending Requests for Your Books</h2>
                    <div className="space-y-3">
                      {donorRequests.filter((r: any) => r.status === 'pending').slice(0, 3).map((req: any) => (
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{req.requesterId?.name} wants <span className="text-blue-600">{req.bookId?.title}</span></p>
                            {req.message && <p className="text-sm text-gray-500 mt-1">"{req.message}"</p>}
                            <p className="text-xs text-gray-400 mt-1">{formatDate(req.requestDate)}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleRequestResponse(req._id, 'approved')}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                            <button onClick={() => handleRequestResponse(req._id, 'rejected')}
                              className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📚 Your Recent Books</h2>
                  {myBooks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
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

            {/* My Books */}
            {tab === 'my-books' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Donated Books ({myBooks.length})</h2>
                  <Link href="/books/donate" className="text-sm text-blue-600 hover:underline">+ Add New</Link>
                </div>
                {myBooks.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
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

            {/* Requests */}
            {tab === 'requests' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests on Your Books</h2>
                  {donorRequests.length === 0 ? <p className="text-gray-400">No requests yet.</p> : (
                    <div className="space-y-3">
                      {donorRequests.map((req: any) => (
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                <span className="text-blue-600">{req.requesterId?.name}</span> → {req.bookId?.title}
                              </p>
                              {req.message && <p className="text-sm text-gray-500 mt-1 italic">"{req.message}"</p>}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(req.requestDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
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
                        <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
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

            {/* Donations */}
            {tab === 'donations' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donation History ({donations.length})</h2>
                {donations.length === 0 ? <p className="text-gray-400 text-center py-16">No donations yet.</p> : (
                  <div className="space-y-3">
                    {donations.map((don: any) => (
                      <div key={don._id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{don.bookId?.title}</p>
                            <p className="text-sm text-gray-500">
                              {don.donorId?._id === user?._id
                                ? `Given to ${don.receiverId?.name}`
                                : `Received from ${don.donorId?.name}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(don.donationDate)} · {don.deliveryMethod}</p>
                          </div>
                          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getStatusColor(don.status))}>{don.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
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
