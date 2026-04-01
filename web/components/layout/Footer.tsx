import Link from 'next/link'
import { ArrowUpRight, BookHeart, Github, Mail, Twitter } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Browse books', href: '/books' },
    { label: 'Donate a book', href: '/books/donate' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  categories: [
    { label: 'Technology', href: '/books?category=Technology' },
    { label: 'Science', href: '/books?category=Science' },
    { label: 'Literature', href: '/books?category=Literature' },
  ],
  account: [
    { label: 'Login', href: '/auth/login' },
    { label: 'Register', href: '/auth/register' },
    { label: 'Messages', href: '/dashboard/chat' },
  ],
}

export default function Footer() {
  return (
    <footer className="px-3 pb-6 pt-14 sm:px-6">
      <div className="mx-auto grid max-w-[1920px] gap-8 rounded-[2rem]  bg-card/80 px-6 py-8  backdrop-blur sm:px-8 lg:grid-cols-[1.3fr_repeat(3,0.9fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <BookHeart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Adopt A Book</p>
              <p className="text-lg font-semibold">Modern exchange platform</p>
            </div>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            A premium community experience for giving books a second life, making discovery easier for students, donors, and admins.
          </p>
          <div className="mt-6 flex items-center gap-3 text-muted-foreground">
            <a href="#" className="rounded-full border border-border/70 p-2 transition hover:bg-accent hover:text-foreground"><Github className="h-4 w-4" /></a>
            <a href="#" className="rounded-full border border-border/70 p-2 transition hover:bg-accent hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="rounded-full border border-border/70 p-2 transition hover:bg-accent hover:text-foreground"><Mail className="h-4 w-4" /></a>
          </div>
        </div>

        {Object.entries(footerLinks).map(([section, items]) => (
          <div key={section}>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{section}</h4>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <Link key={item.href} href={item.href} className="group flex items-center justify-between text-sm text-foreground/80 transition hover:text-foreground">
                  <span>{item.label}</span>
                 
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="lg:col-span-4 mt-2 flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Adopt A Book. Crafted as a premium book-sharing product.</p>
        </div>
      </div>
    </footer>
  )
}
