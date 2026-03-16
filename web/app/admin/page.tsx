'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, BookOpen, ArrowUpRight, Trash2, Shield, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate, getStatusColor } from '@/lib/utils'

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState([])
  const [books, setBooks] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, booksRes, reqRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/books'),
        api.get('/admin/requests'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users)
      setBooks(booksRes.data.books)
      setRequests(reqRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/admin/users/${id}`)
    fetchData()
  }

  const handleUpdateUserRole = async (id: string, role: string) => {
    await api.put(`/admin/users/${id}`, { role })
    fetchData()
  }

  if (!user || user.role !== 'admin') return null

  const statCards = stats ? [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Books', value: stats.books, icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Requests', value: stats.requests, icon: ArrowUpRight, color: 'bg-amber-50 text-amber-600' },
    { label: 'Donations', value: stats.donations, icon: CheckCircle, color: 'bg-purple-50 text-purple-600' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage the entire Adopt A Book platform</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.color)}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-8 w-fit">
          {['overview', 'users', 'books', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && stats && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Books by Status</h3>
                  <div className="space-y-3">
                    {stats.booksByStatus.map((s: any) => (
                      <div key={s._id} className="flex items-center justify-between">
                        <span className={cn('text-sm font-medium px-2.5 py-0.5 rounded-full', getStatusColor(s._id))}>{s._id}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Books by Category</h3>
                  <div className="space-y-2">
                    {stats.booksByCategory.slice(0, 6).map((c: any) => (
                      <div key={c._id} className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((c.count / stats.books) * 100 * 3, 100)}%` }} />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-28 truncate">{c._id}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-right">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">All Users ({users.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Name', 'Email', 'Role', 'Location', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {users.map((u: any) => (
                        <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-blue-600">{u.name[0]}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <select value={u.role} onChange={e => handleUpdateUserRole(u._id, e.target.value)}
                              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                              <option value="student">Student</option>
                              <option value="donor">Donor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{u.location || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteUser(u._id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Books */}
            {tab === 'books' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">All Books ({books.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Book', 'Author', 'Category', 'Condition', 'Status', 'Donor', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {books.map((book: any) => (
                        <tr key={book._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{book.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[100px] truncate">{book.author}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{book.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{book.condition}</td>
                          <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(book.status))}>{book.status}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{book.donorId?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(book.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Requests */}
            {tab === 'requests' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">All Requests ({requests.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Book', 'Requester', 'Donor', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {requests.map((req: any) => (
                        <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{req.bookId?.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{req.requesterId?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{req.donorId?.name}</td>
                          <td className="px-4 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(req.status))}>{req.status}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.requestDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
