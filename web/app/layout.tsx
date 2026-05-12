import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({subsets: ['latin', 'latin-ext']})

export const metadata: Metadata = {
  title: 'PSD im. Juliana Ursyna Niemcewicza — Plainfield, NJ',
  description: 'Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza w Plainfield, New Jersey.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pl" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
