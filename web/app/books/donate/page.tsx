'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, BookOpen, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor']

export default function DonatePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState({
    title: '', author: '', category: 'Fiction', condition: 'Good',
    description: '', location: user?.location || '', isbn: '', language: 'English', pages: '', tags: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
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
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Book Cover Image</label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-blue-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">Click to upload book cover</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
            </div>

            {/* Form fields */}
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
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ISBN</label>
                <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="Optional"
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
    </div>
  )
}
