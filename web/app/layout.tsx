import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Adopt A Book — Give books a second life',
  description: 'A platform where people donate books they no longer need and students can request those books. Helping reuse books and support education.',
  keywords: ['books', 'donate', 'education', 'students', 'library'],
  openGraph: {
    title: 'Adopt A Book',
    description: 'Give books a second life. Donate or adopt books near you.',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="adopt-a-book-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
