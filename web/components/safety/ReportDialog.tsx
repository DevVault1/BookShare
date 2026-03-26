'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Flag, X } from 'lucide-react'
import api from '@/lib/api'

const categories = [
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'suspicious_user', label: 'Suspicious user' },
  { value: 'harassment', label: 'Harassment or abusive behavior' },
  { value: 'spam', label: 'Spam or scam attempt' },
  { value: 'other', label: 'Other safety concern' },
]

export default function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
  initialCategory = 'other',
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: 'book' | 'user' | 'message' | 'platform' | 'other'
  targetId?: string
  targetLabel: string
  initialCategory?: string
  onSubmitted?: (message: string) => void
}) {
  const [category, setCategory] = useState(initialCategory)
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCategory(initialCategory)
      setPriority('medium')
      setDescription('')
      setError('')
    }
  }, [initialCategory, open])

  if (!open) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/reports', {
        targetType,
        targetId,
        category,
        priority,
        description,
      })
      onSubmitted?.('Your report has been sent to the admin team. Thanks for helping keep the platform safe.')
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              <Flag className="h-3.5 w-3.5" /> Report safety issue
            </div>
            <h3 className="text-lg font-bold text-gray-900">Report {targetLabel}</h3>
            <p className="mt-1 text-sm text-gray-500">Admins will review this report and receive an email alert.</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500">
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">What happened?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Share the details that an admin should review."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>For urgent emergencies or physical safety issues, contact local authorities first.</p>
            </div>
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button onClick={() => onOpenChange(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
