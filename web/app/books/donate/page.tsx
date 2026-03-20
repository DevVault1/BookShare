'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, BookOpen, ArrowLeft, Loader2, ScanLine, Search, Sparkles } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'
import IsbnScannerModal from '@/components/books/IsbnScannerModal'

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor']

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English',
  SI: 'Sinhala',
  TA: 'Tamil',
  FR: 'French',
  ES: 'Spanish',
  DE: 'German',
}

function toDisplayLanguage(value: string) {
  const normalized = (value || '').trim()
  if (!normalized) return 'English'
  const upper = normalized.toUpperCase()
  return LANGUAGE_LABELS[upper] || normalized
}

export default function DonatePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [isbnLoading, setIsbnLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [autofillMessage, setAutofillMessage] = useState('')
  const [metadataLookupDetails, setMetadataLookupDetails] = useState<string[]>([])
  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [metadataSource, setMetadataSource] = useState('')
  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    condition: 'Good',
    description: '',
    location: user?.location || '',
    isbn: '',
    language: 'English',
    pages: '',
    publishedYear: '',
    tags: '',
  })

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleIsbnLookup = async (isbnValue = form.isbn) => {
    const normalized = isbnValue.replace(/[^0-9Xx]/g, '').toUpperCase()
    if (!normalized) {
      setError('Enter or scan an ISBN first')
      return
    }

    setIsbnLoading(true)
    setError('')
    setAutofillMessage('')
    try {
      const { data } = await api.get(`/books/lookup/isbn/${normalized}`)
      setForm(prev => ({
        ...prev,
        isbn: data.isbn || normalized,
        title: data.title || prev.title,
        author: data.author || prev.author,
        description: data.description || prev.description,
        language: data.language ? toDisplayLanguage(data.language) : prev.language,
        pages: data.pages ? String(data.pages) : prev.pages,
        publishedYear: data.publishedYear ? String(data.publishedYear) : prev.publishedYear,
        category: data.category || prev.category,
      }))
      setMetadataLookupDetails(Array.isArray(data.lookupIssues) ? data.lookupIssues : [])
      setMetadataSource(data.metadataSource || '')
      setExternalImageUrl(data.image || '')
      if (!imageFile && data.image) setImagePreview(data.image)
      const providers = [data.providers?.googleBooks ? 'Google Books' : null, data.providers?.openLibrary ? 'Open Library' : null].filter(Boolean)
      setAutofillMessage(
        providers.length
          ? `Book details auto-filled from ${providers.join(' + ')}.`
          : 'Book details auto-filled from the ISBN lookup.'
      )
    } catch (err: any) {
      setMetadataLookupDetails(err.response?.data?.details || [])
      setError(err.response?.data?.message || 'Could not fetch book metadata for that ISBN')
    } finally {
      setIsbnLoading(false)
    }
  }

  const handleDetectedIsbn = async (isbn: string) => {
    setForm(prev => ({ ...prev, isbn }))
    await handleIsbnLookup(isbn)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!form.title || !form.author || !form.category || !form.condition) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('author', form.author)
      fd.append('category', form.category)
      fd.append('condition', form.condition)
      fd.append('description', form.description || '')
      fd.append('location', form.location || '')
      fd.append('isbn', form.isbn || '')
      fd.append('language', form.language)
      if (form.pages) fd.append('pages', form.pages)
      if (form.publishedYear) fd.append('publishedYear', form.publishedYear)
      fd.append('tags', form.tags || '')
      if (!imageFile && externalImageUrl) fd.append('externalImageUrl', externalImageUrl)
      if (imageFile) fd.append('image', imageFile)

      const { data } = await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push(`/books/${data._id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to list book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Books
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Donate a Book</h1>
          <p className="text-gray-500 mb-8">Share a book with someone who needs it</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-900 px-5 py-5">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    <Sparkles className="w-4 h-4" /> ISBN Smart Autofill
                  </div>
                  <p className="text-sm text-blue-900/80 dark:text-blue-100/80">
                    Type or scan an ISBN to auto-fill the cover image, description, page count, published year, and ISBN using Google Books with Open Library as fallback.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-[1fr_auto_auto] gap-3">
                <input
                  name="isbn"
                  value={form.isbn}
                  onChange={handleChange}
                  placeholder="Enter or paste ISBN"
                  className="w-full border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleIsbnLookup()}
                  disabled={isbnLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isbnLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Autofill
                </button>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 dark:border-blue-800 px-4 py-3 font-semibold text-blue-700 dark:text-blue-300 hover:bg-white/80 dark:hover:bg-gray-900 transition-colors"
                >
                  <ScanLine className="w-4 h-4" /> Scan ISBN
                </button>
              </div>

              {autofillMessage && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {autofillMessage}
                  {metadataSource ? <span className="block text-xs text-green-600 mt-1">Source: {metadataSource.replace(/_/g, ' ')}</span> : null}
                </div>
              )}

              {!!metadataLookupDetails.length && !autofillMessage && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <p className="font-medium mb-1">Lookup notes</p>
                  <ul className="list-disc ml-5 space-y-1">
                    {metadataLookupDetails.map(detail => <li key={detail}>{detail}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Book Cover Image</label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-blue-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">Upload your own cover or use ISBN autofill</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              {externalImageUrl && !imageFile ? (
                <p className="text-xs text-gray-500 mt-2">Using cover from metadata lookup. Upload a file above to override it.</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required
                  placeholder="e.g. The Great Gatsby"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author *</label>
                <input name="author" value={form.author} onChange={handleChange} required
                  placeholder="e.g. F. Scott Fitzgerald"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition *</label>
                <select name="condition" value={form.condition} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                  placeholder="Tell us about the book..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                <input name="language" value={form.language} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pages</label>
                <input name="pages" value={form.pages} onChange={handleChange} type="number" placeholder="e.g. 320"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Published Year</label>
                <input name="publishedYear" value={form.publishedYear} onChange={handleChange} type="number" placeholder="e.g. 2005"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. classic, novel, english"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5" />
              {loading ? 'Listing Book...' : 'Donate This Book'}
            </button>
          </form>
        </motion.div>
      </div>
      <Footer />
      <IsbnScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetectedIsbn} />
    </div>
  )
}
