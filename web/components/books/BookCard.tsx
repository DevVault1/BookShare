"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Heart, MapPin, ShieldCheck, Star } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn, formatRating, getConditionColor, getStatusColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import StarDisplay from '@/components/reviews/StarDisplay'

interface BookCardProps {
  book: {
    _id: string
    title: string
    author: string
    category: string
    condition: string
    image?: string
    status: string
    location?: string
    ratingsAverage?: number
    ratingsCount?: number
    donorId?: {
      name: string
      profileImage?: string
      donorReputation?: {
        overallScore?: number
      }
    }
  }
}

export default function BookCard({ book }: BookCardProps) {
  const [liked, setLiked] = useState(false)

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
      <Card className="group overflow-hidden rounded-[1.75rem] border-border/60">
        <Link href={`/books/${book._id}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/10 to-violet-500/10">
            {book.image ? (
              <img src={book.image} alt={book.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <div className="grid h-full place-items-center text-primary/50">
                <Star className="h-10 w-10" />
              </div>
            )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <div className="flex flex-wrap gap-2">
                <span className={cn('rounded-full px-3 py-1 text-xs font-medium backdrop-blur', getConditionColor(book.condition))}>{book.condition}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-medium backdrop-blur', getStatusColor(book.status))}>{book.status}</span>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  setLiked((value) => !value)
                }}
                className="rounded-full border border-white/30 bg-white/80 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                aria-label="Add to wishlist"
              >
                <Heart className={cn('h-4 w-4 transition', liked && 'fill-current text-rose-500')} />
              </button>
            </div>

            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl border border-white/30 bg-white/85 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{book.category}</p>
              </div>
              <Button variant="glass" size="sm" className="rounded-full px-4">View</Button>
            </div>
          </div>
        </Link>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{book.category}</p>
            <Link href={`/books/${book._id}`} className="mt-2 block text-lg font-semibold leading-7 text-foreground transition hover:text-primary line-clamp-2">
              {book.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">by {book.author}</p>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{book.location || 'Location shared after request'}</span>
            </div>
            {book.donorId?.donorReputation?.overallScore ? (
              <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheck className="mr-1 h-3 w-3" /> {formatRating(book.donorId.donorReputation.overallScore)}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
            <div>
              {book.ratingsCount ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StarDisplay value={book.ratingsAverage} size="sm" />
                  <span>{formatRating(book.ratingsAverage)} · {book.ratingsCount} review{book.ratingsCount === 1 ? '' : 's'}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No public reviews yet</p>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <Link href={`/books/${book._id}`}>Details</Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
