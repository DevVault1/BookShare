"use client"

import { useEffect, useState } from 'react'
import { AlertTriangle, Flag } from 'lucide-react'

import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <Flag className="h-3.5 w-3.5" /> Report safety issue
          </div>
          <DialogTitle>Report {targetLabel}</DialogTitle>
          <DialogDescription>Admins will review this report and receive an alert. Share enough context to help them act quickly.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <select id="reason" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="details">What happened?</Label>
          <Textarea id="details" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Describe what the admin team should review." />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>For urgent emergencies or physical safety issues, contact local authorities first.</p>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div> : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !description.trim()} className="bg-red-600 hover:bg-red-700">
            {loading ? 'Submitting...' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
