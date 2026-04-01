"use client"
import Image from 'next/image'
import imgbook from '../assets/book.jpg'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookHeart, BookMarked, Compass, HeartHandshake, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { label: 'Books rehomed', value: '12.4k+' },
  { label: 'Active donors', value: '3.2k+' },
  { label: 'Student requests', value: '9.8k+' },
  { label: 'Average donor rating', value: '4.9/5' },
]

const features = [
  {
    icon: Sparkles,
    title: 'Premium discovery',
    description: 'Fast category browsing, donor trust signals, and polished book cards built for conversion.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time conversations',
    description: 'Talk directly to donors or readers with modern messaging surfaces and status visibility.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust-first exchanges',
    description: 'Ratings, private reviews, safety reports, and 2FA support help the community stay secure.',
  },
]

const steps = [
  { icon: BookMarked, title: 'List a book', description: 'Add details, upload a cover, and enrich the listing with ISBN metadata.' },
  { icon: Compass, title: 'Match the right reader', description: 'Students browse polished listings and send thoughtful requests in seconds.' },
  { icon: HeartHandshake, title: 'Complete the handoff', description: 'Coordinate delivery, confirm receipt, and leave reviews that strengthen trust.' },
]

export default function HomePage() {
  return (
    <div className="page-shell">
      <Navbar />

      <main className="px-3 pb-8 sm:px-6">
        <section className="mx-auto mt-6 grid max-w-[1920px] gap-8  lg:items-center">

          
          
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="  relative overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-14">
            <div className="absolute inset-0 grid-overlay opacity-40" />
            <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative">
              <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold">Modern shadcn-inspired book exchange</Badge>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl lg:text-6xl">
                Give every book a <span className="gradient-text">premium second life</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Adopt A Book now feels like a polished SaaS product: cleaner discovery, clearer trust signals, faster dashboards, and mobile-friendly book sharing for every user role.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-6 ">
                  <Link href="/books">
                    Browse books <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                  <Link href="/auth/register">Start donating</Link>
                </Button>


                {/* <Image src={imgbook} alt="heroimage"/> */}
              </div>
          
            </div>
          </motion.div>

        </section>

        <section className="mx-auto mt-6 max-w-[1920px]">
          <div className="grid gap-4 rounded-[2rem] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] bg-background/70 px-5 py-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>


        <section className="mx-auto mt-16 max-w-[1920px]">
          <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
            <CardContent className="flex flex-col gap-6 p-8 text-center sm:p-10">
              <div className="mx-auto inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90">
                Shipping a premium community product
              </div>
              <h2 className="text-3xl font-semibold text-balance sm:text-4xl">Ready to donate, discover, and coordinate beautifully?</h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
                The refreshed UI gives every route a cleaner information hierarchy, better mobile ergonomics, and modern shadcn-style interactions.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" variant="glass" className="rounded-full bg-white text-slate-950 hover:bg-white/90 dark:bg-white dark:text-slate-950">
                  <Link href="/auth/register">Create an account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/books">Explore the catalog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>

      <Footer />
    </div>
  )
}
