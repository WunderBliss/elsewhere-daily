import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Elsewhere Daily',
  description: 'An AI-powered daily newsletter.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-white text-gray-900 antialiased`}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
