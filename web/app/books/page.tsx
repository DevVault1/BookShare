'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, BookOpen, Plus } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BookCard from '@/components/books/BookCard'
import api from '@/lib/api'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'

const CATEGORIES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair', 'Poor']

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [page, setPage] = useState(1)
  const { user } = useAuthStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) setCategory(cat)
  }, [searchParams])

  useEffect(() => {
    fetchBooks()
  }, [category, condition, page])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 12 }
      if (search) params.search = search
      if (category !== 'All') params.category = category
      if (condition !== 'All') params.condition = condition

      const { data } = await api.get('/books', { params })
      setBooks(data.books)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBooks()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Books</h1>
            <p className="text-gray-500 mt-1">{total} books available for adoption</p>
          </div>
          {user && (
            <Link href="/books/donate"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Donate a Book
            </Link>
          )}
        </div>

        {/* Search + Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search books, authors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Search
            </button>
          </form>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Condition filter */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-gray-500 self-center mr-1">Condition:</span>
            {CONDITIONS.map(cond => (
              <button
                key={cond}
                onClick={() => { setCondition(cond); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${condition === cond ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Books grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No books found</h3>
            <p className="text-gray-400">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            {books.map((book: any, i) => (
              <motion.div key={book._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
