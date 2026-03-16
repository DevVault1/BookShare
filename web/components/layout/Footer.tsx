import Link from 'next/link'
import { BookOpen, Github, Twitter, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <BookOpen className="w-7 h-7 text-blue-500" />
              Adopt A Book
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Connecting book donors with eager readers. Giving books a second life and knowledge a second chance.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/books" className="hover:text-white transition-colors">Browse Books</Link></li>
              <li><Link href="/books/donate" className="hover:text-white transition-colors">Donate a Book</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {['Fiction', 'Science', 'Mathematics', 'Technology', 'History'].map(c => (
                <li key={c}><Link href={`/books?category=${c}`} className="hover:text-white transition-colors">{c}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">My Books</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          © {new Date().getFullYear()} Adopt A Book. Built with ❤️ for education.
        </div>
      </div>
    </footer>
  )
}
