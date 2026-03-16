'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Heart, Users, Star, ArrowRight, BookMarked, Sparkles, MapPin } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } })
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Books find new homes here
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
            >
              Give Books a{' '}
              <span className="text-yellow-300">Second Life</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl leading-relaxed"
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
            >
              Adopt A Book connects generous donors with eager students. Donate books you no longer need. Find books that can change your life.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
            >
              <Link
                href="/books"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Browse Books <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all"
              >
                Start Donating <Heart className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1080 60 360 0 0 30L0 60Z" fill="white" className="dark:fill-gray-950" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Books Donated', value: '12,000+', icon: BookOpen, color: 'text-blue-600' },
              { label: 'Happy Readers', value: '8,500+', icon: Users, color: 'text-green-600' },
              { label: 'Active Donors', value: '3,200+', icon: Heart, color: 'text-red-500' },
              { label: 'Categories', value: '10+', icon: BookMarked, color: 'text-purple-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 mb-4 ${stat.color}`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">Three simple steps to share knowledge</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Donate a Book', desc: 'List any book you want to give away. Add photos, condition details, and a short description.', icon: BookOpen, color: 'bg-blue-600' },
              { step: '02', title: 'Find Your Match', desc: 'Students browse and request books they need. Donors review and approve requests.', icon: Heart, color: 'bg-rose-500' },
              { step: '03', title: 'Complete Adoption', desc: 'Arrange delivery or pickup. The book finds its new loving home. Knowledge lives on!', icon: Star, color: 'bg-amber-500' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="absolute top-6 right-6 text-6xl font-black text-gray-50 dark:text-gray-700">{item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Platform Features</span>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-6">Everything You Need to Share Knowledge</h2>
              <div className="space-y-6">
                {[
                  { icon: MapPin, title: 'Location-Based Discovery', desc: 'Find books near you. Connect with local donors and reduce delivery hassle.' },
                  { icon: Sparkles, title: 'AI Recommendations', desc: 'Get personalized book suggestions based on your interests and reading history.' },
                  { icon: BookMarked, title: 'Chat with Donors', desc: 'Communicate directly with donors to arrange pickup, ask questions, and build community.' },
                ].map((f, i) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {['Fiction', 'Science', 'History', 'Technology', 'Math', 'Arts'].map((cat, i) => (
                    <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{cat}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-blue-600 rounded-xl p-4 text-white text-center">
                  <div className="font-semibold">And many more categories...</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl text-blue-100 mb-10">Join thousands of donors and students who are already sharing the love of reading.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register?role=donor"
                className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                Donate a Book
              </Link>
              <Link href="/auth/register?role=student"
                className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all">
                Find a Book
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
