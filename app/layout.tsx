import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { themeInitScript } from '@/lib/theme'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elsewhere-daily.vercel.app'),
  title: 'Elsewhere Daily',
  description: 'An AI-powered daily newsletter.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set [data-theme] before first paint to avoid a light/dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geist.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors`}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
