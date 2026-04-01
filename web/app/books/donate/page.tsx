"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ScanLine, Sparkles, UploadCloud } from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import IsbnScannerModal from '@/components/books/IsbnScannerModal'
import { useAuthStore } from '@/lib/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor']

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  si: 'Sinhala',
  ta: 'Tamil',
}

function normalizeLanguage(value: string) {
  const normalized = (value || '').trim()
  if (!normalized) return ''
  const upper = normalized.toUpperCase()
  if (upper === 'EN' || upper === 'ENG' || upper === 'ENGLISH') return 'en'
  if (upper === 'SI' || upper === 'SIN' || upper === 'SINHALA') return 'si'
  if (upper === 'TA' || upper === 'TAM' || upper === 'TAMIL') return 'ta'
  return normalized.toLowerCase()
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
    description: '',
    category: 'Fiction',
    condition: 'Good',
    location: user?.location || '',
    isbn: '',
    language: 'en',
    publishedYear: '',
    publisher: '',
    pages: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setExternalImageUrl('')
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleIsbnLookup = async (isbnValue = form.isbn) => {
    const normalized = isbnValue.replace(/[^0-9Xx]/g, '').toUpperCase()
    if (!(normalized.length === 10 || normalized.length === 13)) {
      setError('Enter a valid ISBN-10 or ISBN-13 to autofill metadata.')
      return
    }

    setError('')
    setAutofillMessage('')
    setMetadataLookupDetails([])
    setMetadataSource('')
    setIsbnLoading(true)

    try {
      const { data } = await api.get(`/books/lookup/isbn/${normalized}`)
      const providers = [data.providers?.googleBooks ? 'Google Books' : null, data.providers?.openLibrary ? 'Open Library' : null].filter(Boolean)
      const normalizedLanguage = normalizeLanguage(data.book?.language || form.language || 'en')

      setForm((prev) => ({
        ...prev,
        isbn: normalized,
        title: data.book?.title || prev.title,
        author: data.book?.author || prev.author,
        description: data.book?.description || prev.description,
        category: data.book?.category || prev.category,
        language: normalizedLanguage || prev.language,
        publishedYear: data.book?.publishedYear ? String(data.book.publishedYear) : prev.publishedYear,
        publisher: data.book?.publisher || prev.publisher,
        pages: data.book?.pages ? String(data.book.pages) : prev.pages,
      }))

      if (data.book?.image) {
        setImagePreview(data.book.image)
        setExternalImageUrl(data.book.image)
        setImageFile(null)
      }

      setMetadataSource(providers.join(', '))
      setMetadataLookupDetails(data.details || [])
      setAutofillMessage(data.message || 'Book metadata filled successfully.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch book metadata from ISBN.')
    } finally {
      setIsbnLoading(false)
    }
  }

  const handleDetectedIsbn = async (isbn: string) => {
    setForm((prev) => ({ ...prev, isbn }))
    await handleIsbnLookup(isbn)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, value]) => fd.append(key, value))
      if (imageFile) {
        fd.append('image', imageFile)
      } else if (externalImageUrl) {
        fd.append('externalImageUrl', externalImageUrl)
      }

      const { data } = await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push(`/books/${data._id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create book listing')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="mx-auto max-w-4xl px-3 py-16 sm:px-6">
          <Card className="rounded-[2rem] text-center">
            <CardContent className="p-10">
              <h1 className="text-3xl font-semibold">Sign in to donate books</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Creating polished listings is part of the redesigned donor experience.</p>
              <Button asChild className="mt-6 rounded-full"><Link href="/auth/login">Go to login</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <section className="surface-card rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Donor workspace</p>
              <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-5xl">Create a premium book listing with richer metadata and cleaner inputs.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Autofill details from ISBN, upload a polished cover preview, and publish a card that feels at home in the new catalog experience.
              </p>
            </div>
            <Card className="rounded-[1.75rem] border-border/60 bg-primary text-primary-foreground shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">Fast listing flow</div>
                <p className="text-2xl font-semibold">Metadata + media + trust</p>
                <p className="text-sm text-primary-foreground/80">The form now guides donors through the complete creation flow on both desktop and mobile.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Book details</CardTitle>
                <CardDescription>Capture the information readers need to decide quickly.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Atomic Habits" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" name="author" value={form.author} onChange={handleChange} placeholder="James Clear" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" value={form.category} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select id="condition" name="condition" value={form.condition} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {CONDITIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Pickup location</Label>
                  <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Colombo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select id="language" name="language" value={form.language} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {Object.entries(LANGUAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Published year</Label>
                  <Input id="publishedYear" name="publishedYear" value={form.publishedYear} onChange={handleChange} placeholder="2023" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input id="publisher" name="publisher" value={form.publisher} onChange={handleChange} placeholder="Publisher name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages">Pages</Label>
                  <Input id="pages" name="pages" value={form.pages} onChange={handleChange} placeholder="320" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Describe the condition, notes, and who this book is ideal for." />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>ISBN autofill</CardTitle>
                <CardDescription>Use metadata providers to save time and standardize listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input id="isbn" name="isbn" value={form.isbn} onChange={handleChange} placeholder="978..." />
                  </div>
                  <Button type="button" variant="outline" onClick={() => handleIsbnLookup()} className="self-end rounded-xl">
                    {isbnLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Autofill
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setScannerOpen(true)} className="self-end rounded-xl">
                    <ScanLine className="mr-2 h-4 w-4" /> Scan ISBN
                  </Button>
                </div>
                {autofillMessage ? <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{autofillMessage}</div> : null}
                {metadataSource ? <p className="text-sm text-muted-foreground">Metadata source: {metadataSource}</p> : null}
                {metadataLookupDetails.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {metadataLookupDetails.map((detail) => <li key={detail} className="rounded-xl bg-muted/70 px-3 py-2">{detail}</li>)}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 h-fit">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Cover preview</CardTitle>
                <CardDescription>Add a polished image for the redesigned listing card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border/80 bg-muted/40 px-6 py-10 text-center transition hover:border-primary/40 hover:bg-primary/5">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Book preview" className="mb-4 aspect-[4/5] w-full rounded-[1.5rem] object-cover" />
                  ) : (
                    <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                  )}
                  <p className="font-medium">{imagePreview ? 'Change cover image' : 'Upload cover image'}</p>
                  <p className="mt-2 text-sm text-muted-foreground">PNG or JPG files work best for the new card design.</p>
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </label>

                <div className="rounded-[1.5rem] bg-muted/70 p-4 text-sm text-muted-foreground">
                  Your listing card will automatically pick up any uploaded cover or ISBN-sourced image.
                </div>

                {error ? <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}

                <Button type="submit" disabled={loading} className="w-full rounded-xl">
                  {loading ? 'Publishing...' : 'Publish listing'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>

      <IsbnScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetectedIsbn} />
      <Footer />
    </div>
  )
}
