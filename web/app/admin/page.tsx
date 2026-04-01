'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  FileDown,
  Flag,
  LineChart,
  Mail,
  MessagesSquare,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TrendBars from '@/components/analytics/TrendBars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [reports, setReports] = useState<any[]>([])
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
  }, [user, reportPeriod, router])

  const fetchData = async (period: 'weekly' | 'monthly') => {
    setLoading(true)
    try {
      const [statsRes, usersRes, booksRes, reqRes, reportRes, safetyReportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/books'),
        api.get('/admin/requests'),
        api.get(`/analytics/admin/report?period=${period}`),
        api.get('/reports/admin'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users)
      setBooks(booksRes.data.books)
      setRequests(reqRes.data)
      setReport(reportRes.data)
      setReports(safetyReportsRes.data)
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

  const handleUpdateReport = async (id: string, updates: Record<string, string>) => {
    await api.put(`/reports/admin/${id}`, updates)
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

  const statCards = useMemo(
    () =>
      stats
        ? [
            { label: 'Total users', value: stats.users, icon: Users },
            { label: 'Total books', value: stats.books, icon: BookOpen },
            { label: 'Requests', value: stats.requests, icon: ArrowUpRight },
            { label: 'Donations', value: stats.donations, icon: CheckCircle },
          ]
        : [],
    [stats]
  )

  const growthCards = useMemo(
    () =>
      report
        ? [
            { label: 'New users', value: report.metrics.newUsers.current, delta: report.metrics.newUsers.delta, icon: Users },
            { label: 'New books', value: report.metrics.newBooks.current, delta: report.metrics.newBooks.delta, icon: BookOpen },
            { label: 'Completed donations', value: report.metrics.completedDonations.current, delta: report.metrics.completedDonations.delta, icon: CheckCircle },
            { label: 'Messages', value: report.metrics.messages.current, delta: report.metrics.messages.delta, icon: MessagesSquare },
          ]
        : [],
    [report]
  )

  if (!user || user.role !== 'admin') return null

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <section className="surface-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                <Shield className="mr-1 h-3.5 w-3.5" /> Platform command center
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold sm:text-4xl">Admin workspace</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Monitor growth, manage trust and safety, review catalog health, and export leadership-ready insights from one premium control surface.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Tabs value={reportPeriod} onValueChange={(value) => setReportPeriod(value as 'weekly' | 'monthly')}>
                <TabsList className="rounded-full border border-border/60 bg-background/80 p-1">
                  <TabsTrigger value="weekly" className="rounded-full px-4 capitalize">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="rounded-full px-4 capitalize">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" className="rounded-full" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                <FileDown className="mr-2 h-4 w-4" /> {downloadingPdf ? 'Preparing PDF...' : 'Export PDF'}
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[1.5rem]" />)
              : statCards.map((item) => (
                  <Card key={item.label} className="rounded-[1.5rem] border-white/20 bg-white/50 shadow-none dark:bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardDescription>{item.label}</CardDescription>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold">{item.value}</div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="surface-card h-fit rounded-[1.75rem] p-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Navigation</p>
            <div className="mt-3 grid gap-2">
              {[
                { value: 'overview', label: 'Overview', icon: Shield },
                { value: 'analytics', label: 'Analytics', icon: LineChart },
                { value: 'users', label: 'Users', icon: Users },
                { value: 'books', label: 'Books', icon: BookOpen },
                { value: 'requests', label: 'Requests', icon: ArrowUpRight },
                { value: 'safety', label: 'Trust & safety', icon: Flag },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted/70',
                    tab === item.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-56 rounded-[1.75rem]" />
                ))}
              </div>
            ) : (
              <>
                {tab === 'overview' && stats && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-[1.75rem]">
                      <CardHeader>
                        <CardTitle>Books by status</CardTitle>
                        <CardDescription>Current lifecycle mix across all listings.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(stats.booksByStatus || []).length === 0 ? (
                          <EmptyState icon={BookOpen} title="No status data yet" description="As catalog activity grows, distribution by status will appear here." className="border-0 bg-transparent px-0 py-4 shadow-none" />
                        ) : (
                          (stats.booksByStatus || []).map((item: any) => (
                            <div key={item._id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                              <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(item._id))}>{item._id}</span>
                              <span className="font-semibold">{item.count}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-[1.75rem]">
                      <CardHeader>
                        <CardTitle>Books by category</CardTitle>
                        <CardDescription>Top categories across the catalog.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(stats.booksByCategory || []).length === 0 ? (
                          <EmptyState icon={BookOpen} title="No category data yet" description="New listings will generate category trends automatically." className="border-0 bg-transparent px-0 py-4 shadow-none" />
                        ) : (
                          (stats.booksByCategory || []).slice(0, 6).map((item: any) => (
                            <div key={item._id} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item._id}</span>
                                <span className="text-muted-foreground">{item.count}</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min((item.count / Math.max(stats.books, 1)) * 100, 100)}%` }} />
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {tab === 'analytics' && report && (
                  <div className="space-y-6">
                    <Card className="rounded-[1.75rem]">
                      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">
                            <LineChart className="mr-1 h-3.5 w-3.5" /> Auto-generated {reportPeriod} report
                          </Badge>
                          <CardTitle className="text-2xl">Growth insights</CardTitle>
                          <CardDescription>
                            Current window: {report.range.currentLabel} · Previous window: {report.range.previousLabel}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="outline" className="rounded-full" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                            <FileDown className="mr-2 h-4 w-4" /> {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                          </Button>
                          <Button className="rounded-full" onClick={handleCopyEmail}>
                            <Mail className="mr-2 h-4 w-4" /> Copy email summary
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {copyState ? <p className="mb-4 text-sm text-emerald-600">{copyState}</p> : null}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {growthCards.map((item) => (
                            <Card key={item.label} className="rounded-[1.5rem] border-white/20 bg-white/50 shadow-none dark:bg-white/5">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>{item.label}</CardDescription>
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-semibold">{item.value}</div>
                                <p className={cn('mt-2 text-sm', item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                  {item.delta >= 0 ? '+' : ''}
                                  {item.delta} vs previous period
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <TrendBars title="User growth trend" subtitle="New user accounts across the selected report window" data={report.trends.users} />
                      <TrendBars title="Book listing trend" subtitle="Books listed during the report window" data={report.trends.books} />
                      <TrendBars title="Request trend" subtitle="Request activity during the report window" data={report.trends.requests} />
                      <TrendBars title="Donation trend" subtitle="Completed donations during the report window" data={report.trends.donations} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      <Card className="rounded-[1.75rem]">
                        <CardHeader>
                          <CardTitle>Top listing categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {report.highlights.topListingCategories.length === 0 ? (
                            <p className="text-muted-foreground">No new listings yet.</p>
                          ) : (
                            report.highlights.topListingCategories.map((item: any) => (
                              <div key={item.label} className="flex items-center justify-between">
                                <span>{item.label}</span>
                                <span className="font-semibold">{item.count}</span>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                      <Card className="rounded-[1.75rem]">
                        <CardHeader>
                          <CardTitle>Impact cities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {report.highlights.topImpactCities.length === 0 ? (
                            <p className="text-muted-foreground">No completed deliveries this period.</p>
                          ) : (
                            report.highlights.topImpactCities.map((item: any) => (
                              <div key={item.label} className="flex items-center justify-between">
                                <span>{item.label}</span>
                                <span className="font-semibold">{item.count}</span>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                      <Card className="rounded-[1.75rem]">
                        <CardHeader>
                          <CardTitle>Email-ready summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="max-h-80 overflow-auto rounded-2xl border border-border/60 bg-muted/40 p-4">
                            <pre className="whitespace-pre-wrap text-xs font-sans text-foreground">{report.email?.text}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {tab === 'users' && (
                  <Card className="overflow-hidden rounded-[1.75rem]">
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>All users ({users.length})</CardTitle>
                        <CardDescription>Manage roles and remove suspicious accounts.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      {users.length === 0 ? (
                        <EmptyState icon={Users} title="No users found" description="User accounts will appear here once people join the platform." className="rounded-none border-0 shadow-none" />
                      ) : (
                        <table className="w-full min-w-[820px]">
                          <thead className="bg-muted/50">
                            <tr>
                              {['Name', 'Email', 'Role', 'Location', 'Joined', 'Actions'].map((header) => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {users.map((u: any) => (
                              <tr key={u._id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                      {u.name?.[0] || '?'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{u.name}</p>
                                      <p className="text-xs text-muted-foreground">ID: {u._id.slice(-6)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                <td className="px-4 py-3">
                                  <select value={u.role} onChange={(e) => handleUpdateUserRole(u._id, e.target.value)} className="rounded-xl border border-border/60 bg-background px-3 py-2 text-xs">
                                    <option value="student">Student</option>
                                    <option value="donor">Donor</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{u.location || '—'}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u._id)}>
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tab === 'books' && (
                  <Card className="overflow-hidden rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>All books ({books.length})</CardTitle>
                      <CardDescription>Track listing quality and catalog health at a glance.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      {books.length === 0 ? (
                        <EmptyState icon={BookOpen} title="No books yet" description="The catalog is empty for now. Listings will appear here once donors start sharing books." className="rounded-none border-0 shadow-none" />
                      ) : (
                        <table className="w-full min-w-[900px]">
                          <thead className="bg-muted/50">
                            <tr>
                              {['Book', 'Author', 'Category', 'Condition', 'Status', 'Donor', 'Date'].map((header) => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {books.map((book: any) => (
                              <tr key={book._id} className="hover:bg-muted/30">
                                <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium">{book.title}</td>
                                <td className="max-w-[180px] truncate px-4 py-3 text-sm text-muted-foreground">{book.author}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{book.category}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{book.condition}</td>
                                <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(book.status))}>{book.status}</span></td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{book.donorId?.name}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(book.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tab === 'requests' && (
                  <Card className="overflow-hidden rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>All requests ({requests.length})</CardTitle>
                      <CardDescription>Review adoption demand and operational throughput.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      {requests.length === 0 ? (
                        <EmptyState icon={ArrowUpRight} title="No requests yet" description="Reader requests will populate this workspace automatically." className="rounded-none border-0 shadow-none" />
                      ) : (
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-muted/50">
                            <tr>
                              {['Book', 'Requester', 'Donor', 'Status', 'Date'].map((header) => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {requests.map((req: any) => (
                              <tr key={req._id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 text-sm font-medium">{req.bookId?.title}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{req.requesterId?.name}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{req.donorId?.name}</td>
                                <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(req.status))}>{req.status}</span></td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(req.requestDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tab === 'safety' && (
                  <Card className="rounded-[1.75rem]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                          <Flag className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>Trust & safety reports ({reports.length})</CardTitle>
                          <CardDescription>Triaging fake listings, suspicious users, harassment, and inappropriate content.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {reports.length === 0 ? (
                        <EmptyState
                          icon={Flag}
                          title="No reports submitted"
                          description="The moderation inbox is currently clear. New trust and safety reports will appear here."
                        />
                      ) : (
                        reports.map((reportItem: any) => (
                          <Card key={reportItem._id} className="rounded-[1.5rem] border-white/20 bg-white/50 shadow-none dark:bg-white/5">
                            <CardContent className="space-y-4 px-5 py-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="rounded-full">{reportItem.category?.replace(/_/g, ' ')}</Badge>
                                    <Badge variant="outline" className="rounded-full">{reportItem.targetType}</Badge>
                                    <Badge
                                      className={cn(
                                        'rounded-full hover:opacity-100',
                                        reportItem.status === 'resolved'
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                          : reportItem.status === 'dismissed'
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-200'
                                            : reportItem.status === 'under_review'
                                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                              : 'bg-rose-100 text-rose-800 hover:bg-rose-100'
                                      )}
                                    >
                                      {reportItem.status?.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                  <p className="font-semibold">{reportItem.reporterId?.name} <span className="text-sm font-normal text-muted-foreground">({reportItem.reporterId?.email})</span></p>
                                  <p className="mt-2 text-sm text-muted-foreground">{reportItem.description}</p>
                                  <p className="mt-2 text-xs text-muted-foreground">Submitted {formatDate(reportItem.createdAt)}</p>
                                  {reportItem.adminNotes ? (
                                    <p className="mt-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
                                      <span className="font-medium">Admin note:</span> {reportItem.adminNotes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  <Button variant="outline" size="sm" onClick={() => handleUpdateReport(reportItem._id, { status: 'under_review' })}>Mark under review</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleUpdateReport(reportItem._id, { status: 'resolved', adminNotes: 'Resolved by admin team.' })}>Resolve</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleUpdateReport(reportItem._id, { status: 'dismissed', adminNotes: 'Dismissed after review.' })}>Dismiss</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )}

                {!loading && tab === 'analytics' && !report ? (
                  <EmptyState
                    icon={LineChart}
                    title="Analytics report unavailable"
                    description="The reporting API did not return data for this period. Try switching the timeframe or refreshing the page."
                    action={<Button asChild className="rounded-full"><Link href="/dashboard">Return to dashboard</Link></Button>}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
