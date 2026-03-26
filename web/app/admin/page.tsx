'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  BookOpen,
  ArrowUpRight,
  Trash2,
  Shield,
  CheckCircle,
  FileDown,
  Mail,
  MessagesSquare,
  LineChart,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import TrendBars from '@/components/analytics/TrendBars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate, getStatusColor } from '@/lib/utils'

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [tab, setTab] = useState('overview')
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [copyState, setCopyState] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchData(reportPeriod)
  }, [user, reportPeriod])

  const fetchData = async (period: 'weekly' | 'monthly') => {
    setLoading(true)
    try {
      const [statsRes, usersRes, booksRes, reqRes, reportRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/books'),
        api.get('/admin/requests'),
        api.get(`/analytics/admin/report?period=${period}`),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users)
      setBooks(booksRes.data.books)
      setRequests(reqRes.data)
      setReport(reportRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/admin/users/${id}`)
    fetchData(reportPeriod)
  }

  const handleUpdateUserRole = async (id: string, role: string) => {
    await api.put(`/admin/users/${id}`, { role })
    fetchData(reportPeriod)
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      const response = await api.get(`/analytics/admin/report/pdf?period=${reportPeriod}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `adopt-a-book-${reportPeriod}-report.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleCopyEmail = async () => {
    if (!report?.email?.text) return
    await navigator.clipboard.writeText(report.email.text)
    setCopyState('Email summary copied')
    setTimeout(() => setCopyState(''), 1800)
  }

  if (!user || user.role !== 'admin') return null

  const statCards = stats ? [
    { label: 'Total Users', value: stats.users, icon: Users },
    { label: 'Total Books', value: stats.books, icon: BookOpen },
    { label: 'Requests', value: stats.requests, icon: ArrowUpRight },
    { label: 'Donations', value: stats.donations, icon: CheckCircle },
  ] : []

  const growthCards = report ? [
    { label: 'New users', value: report.metrics.newUsers.current, delta: report.metrics.newUsers.delta, icon: Users },
    { label: 'New books', value: report.metrics.newBooks.current, delta: report.metrics.newBooks.delta, icon: BookOpen },
    { label: 'Completed donations', value: report.metrics.completedDonations.current, delta: report.metrics.completedDonations.delta, icon: CheckCircle },
    { label: 'Messages', value: report.metrics.messages.current, delta: report.metrics.messages.delta, icon: MessagesSquare },
  ] : []

  return (
    <div className='min-h-screen bg-muted/20'>
      <Navbar />
      <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
              <Shield className='h-5 w-5' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Admin Dashboard</h1>
              <p className='text-sm text-muted-foreground'>Manage platform activity with shadcn analytics surfaces and reports.</p>
            </div>
          </div>
          <Tabs value={reportPeriod} onValueChange={(value) => setReportPeriod(value as 'weekly' | 'monthly')}>
            <TabsList>
              <TabsTrigger value='weekly' className='capitalize'>Weekly</TabsTrigger>
              <TabsTrigger value='monthly' className='capitalize'>Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {stats && (
          <div className='mb-8 grid grid-cols-2 gap-4 md:grid-cols-4'>
            {statCards.map((item) => (
              <Card key={item.label}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                  <CardDescription>{item.label}</CardDescription>
                  <item.icon className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-3xl font-bold'>{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className='space-y-6'>
          <TabsList className='h-auto flex-wrap justify-start gap-1 rounded-xl p-1'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
            <TabsTrigger value='users'>Users</TabsTrigger>
            <TabsTrigger value='books'>Books</TabsTrigger>
            <TabsTrigger value='requests'>Requests</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className='h-40 animate-pulse bg-muted' />
            ))}
          </div>
        ) : (
          <>
            {tab === 'overview' && stats && (
              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Books by status</CardTitle>
                    <CardDescription>Current lifecycle mix across all listings.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {(stats.booksByStatus || []).map((item: any) => (
                      <div key={item._id} className='flex items-center justify-between rounded-lg border p-3'>
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(item._id))}>{item._id}</span>
                        <span className='font-semibold'>{item.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Books by category</CardTitle>
                    <CardDescription>Top categories across the catalog.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {(stats.booksByCategory || []).slice(0, 6).map((item: any) => (
                      <div key={item._id} className='space-y-1'>
                        <div className='flex items-center justify-between text-sm'>
                          <span>{item._id}</span>
                          <span className='text-muted-foreground'>{item.count}</span>
                        </div>
                        <div className='h-2 rounded-full bg-muted'>
                          <div className='h-2 rounded-full bg-primary' style={{ width: `${Math.min((item.count / Math.max(stats.books, 1)) * 300, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'reports' && report && (
              <div className='space-y-8'>
                <Card>
                  <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                      <Badge variant='secondary' className='mb-3 inline-flex gap-2'>
                        <LineChart className='h-3.5 w-3.5' /> Auto-generated {reportPeriod} report
                      </Badge>
                      <CardTitle className='text-2xl'>Platform growth insights</CardTitle>
                      <CardDescription>
                        Current window: {report.range.currentLabel} · Previous window: {report.range.previousLabel}
                      </CardDescription>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                      <Button onClick={handleDownloadPdf} disabled={downloadingPdf} variant='outline'>
                        <FileDown className='mr-2 h-4 w-4' /> {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                      </Button>
                      <Button onClick={handleCopyEmail}>
                        <Mail className='mr-2 h-4 w-4' /> Copy email summary
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {copyState ? <p className='mb-4 text-sm text-emerald-600'>{copyState}</p> : null}
                    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                      {growthCards.map((item) => (
                        <Card key={item.label} className='bg-muted/40 shadow-none'>
                          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardDescription>{item.label}</CardDescription>
                            <item.icon className='h-4 w-4 text-muted-foreground' />
                          </CardHeader>
                          <CardContent>
                            <div className='text-3xl font-bold'>{item.value}</div>
                            <p className={cn('mt-2 text-sm', item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                              {item.delta >= 0 ? '+' : ''}{item.delta} vs previous period
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className='grid gap-6 xl:grid-cols-2'>
                  <TrendBars title='User growth trend' subtitle='New user accounts across the selected report window' data={report.trends.users} />
                  <TrendBars title='Book listing trend' subtitle='Books listed during the report window' data={report.trends.books} />
                  <TrendBars title='Request trend' subtitle='Request activity during the report window' data={report.trends.requests} />
                  <TrendBars title='Donation trend' subtitle='Completed donations during the report window' data={report.trends.donations} />
                </div>

                <div className='grid gap-6 lg:grid-cols-3'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top listing categories</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {report.highlights.topListingCategories.length === 0 ? <p className='text-sm text-muted-foreground'>No new listings yet.</p> : report.highlights.topListingCategories.map((item: any) => (
                        <div key={item.label} className='flex items-center justify-between text-sm'>
                          <span>{item.label}</span>
                          <span className='font-semibold'>{item.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Impact cities</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {report.highlights.topImpactCities.length === 0 ? <p className='text-sm text-muted-foreground'>No completed deliveries this period.</p> : report.highlights.topImpactCities.map((item: any) => (
                        <div key={item.label} className='flex items-center justify-between text-sm'>
                          <span>{item.label}</span>
                          <span className='font-semibold'>{item.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Email-ready summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='max-h-72 overflow-auto rounded-lg border bg-muted/40 p-4'>
                        <pre className='whitespace-pre-wrap text-xs font-sans text-foreground'>{report.email?.text}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent className='overflow-x-auto p-0'>
                  <table className='w-full'>
                    <thead className='bg-muted/50'>
                      <tr>
                        {['Name', 'Email', 'Role', 'Location', 'Joined', 'Actions'].map((header) => (
                          <th key={header} className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {users.map((u: any) => (
                        <tr key={u._id} className='hover:bg-muted/30'>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10'>
                                <span className='text-xs font-bold text-primary'>{u.name?.[0] || '?'}</span>
                              </div>
                              <span className='text-sm font-medium'>{u.name}</span>
                            </div>
                          </td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{u.email}</td>
                          <td className='px-4 py-3'>
                            <select value={u.role} onChange={(e) => handleUpdateUserRole(u._id, e.target.value)} className='rounded-md border bg-background px-2 py-1 text-xs'>
                              <option value='student'>Student</option>
                              <option value='donor'>Donor</option>
                              <option value='admin'>Admin</option>
                            </select>
                          </td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{u.location || '—'}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{formatDate(u.createdAt)}</td>
                          <td className='px-4 py-3'>
                            <Button variant='ghost' size='icon' onClick={() => handleDeleteUser(u._id)}>
                              <Trash2 className='h-4 w-4 text-red-500' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {tab === 'books' && (
              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle>All Books ({books.length})</CardTitle>
                </CardHeader>
                <CardContent className='overflow-x-auto p-0'>
                  <table className='w-full'>
                    <thead className='bg-muted/50'>
                      <tr>
                        {['Book', 'Author', 'Category', 'Condition', 'Status', 'Donor', 'Date'].map((header) => (
                          <th key={header} className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {books.map((book: any) => (
                        <tr key={book._id} className='hover:bg-muted/30'>
                          <td className='max-w-[150px] truncate px-4 py-3 text-sm font-medium'>{book.title}</td>
                          <td className='max-w-[100px] truncate px-4 py-3 text-sm text-muted-foreground'>{book.author}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{book.category}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{book.condition}</td>
                          <td className='px-4 py-3'><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(book.status))}>{book.status}</span></td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{book.donorId?.name}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{formatDate(book.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {tab === 'requests' && (
              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle>All Requests ({requests.length})</CardTitle>
                </CardHeader>
                <CardContent className='overflow-x-auto p-0'>
                  <table className='w-full'>
                    <thead className='bg-muted/50'>
                      <tr>
                        {['Book', 'Requester', 'Donor', 'Status', 'Date'].map((header) => (
                          <th key={header} className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {requests.map((req: any) => (
                        <tr key={req._id} className='hover:bg-muted/30'>
                          <td className='px-4 py-3 text-sm font-medium'>{req.bookId?.title}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{req.requesterId?.name}</td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{req.donorId?.name}</td>
                          <td className='px-4 py-3'><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(req.status))}>{req.status}</span></td>
                          <td className='px-4 py-3 text-sm text-muted-foreground'>{formatDate(req.requestDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
