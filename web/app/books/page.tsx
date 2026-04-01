"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, Plus, Search, SlidersHorizontal } from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookCard from '@/components/books/BookCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'

const CATEGORIES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair', 'Poor']

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [page, setPage] = useState(1)
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) setCategory(categoryParam)
  }, [searchParams])

  useEffect(() => {
    fetchBooks()
  }, [category, condition, page])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 12 }
      if (search) params.search = search
      if (category !== 'All') params.category = category
      if (condition !== 'All') params.condition = condition
      const { data } = await api.get('/books', { params })
      setBooks(data.books)
      setTotal(data.total)
      setPages(data.pages)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    fetchBooks()
  }

  const activeFilters = useMemo(() => [category !== 'All' ? category : null, condition !== 'All' ? condition : null].filter(Boolean), [category, condition])

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <section className="surface-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Catalog experience</p>
              <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-5xl">Discover books with cleaner browsing, faster filters, and richer trust signals.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Browse every available title, compare condition and donor reputation, and move from discovery to messaging in a few clicks.
              </p>
            </div>
            <Card className="rounded-[1.75rem] border-border/60 bg-primary text-primary-foreground shadow-none">
              <CardContent className="p-6">
                <p className="text-sm text-primary-foreground/80">Available inventory</p>
                <p className="mt-2 text-4xl font-semibold">{total}</p>
                <p className="mt-2 text-sm text-primary-foreground/80">Premium cards, responsive grid, and polished empty states.</p>
                {user ? (
                  <Button asChild variant="glass" className="mt-5 rounded-full bg-white text-slate-950 hover:bg-white/90 dark:bg-white dark:text-slate-950">
                    <Link href="/books/donate"><Plus className="mr-2 h-4 w-4" /> Donate a book</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[290px_1fr]">
          <Card className="rounded-[1.75rem] lg:sticky lg:top-28 h-fit">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <SlidersHorizontal className="h-4 w-4" />
                <CardTitle className="text-lg">Search & filters</CardTitle>
              </div>
              <CardDescription>Fine-tune the book catalog without losing context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books or authors" className="pl-10" />
                </div>
                <Button type="submit" className="w-full rounded-xl">Search</Button>
              </form>

              <div>
                <p className="mb-3 text-sm font-medium">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((item) => (
                    <button key={item} type="button" onClick={() => { setCategory(item); setPage(1) }} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Condition</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((item) => (
                    <button key={item} type="button" onClick={() => { setCondition(item); setPage(1) }} className={`rounded-2xl border px-3 py-2 text-sm transition ${condition === item ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-muted/70 p-4">
                <p className="text-sm font-medium">Active filters</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilters.length ? activeFilters.map((item) => <span key={item} className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{item}</span>) : <span className="text-sm text-muted-foreground">No filters selected</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Catalog</h2>
                <p className="mt-1 text-sm text-muted-foreground">{total} books ready for discovery</p>
              </div>
              {user ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/books/donate"><Plus className="mr-2 h-4 w-4" /> Donate a book</Link>
                </Button>
              ) : null}
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3 rounded-[1.75rem] border border-border/60 bg-card p-4">
                    <Skeleton className="aspect-[4/5] w-full rounded-[1.5rem]" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="No books match these filters"
                description="Try a broader category, clear the current condition filter, or search for another title."
                action={<Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); setCondition('All'); setPage(1) }}>Clear filters</Button>}
              />
            ) : (
              <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence>
                  {books.map((book) => (
                    <motion.div key={book._id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <BookCard book={book} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {pages > 1 ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                  <Button key={number} variant={page === number ? 'default' : 'outline'} onClick={() => setPage(number)} className="rounded-full px-4">
                    {number}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
