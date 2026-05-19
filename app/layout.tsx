import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {getLocale} from 'next-intl/server'

const inter = Inter({subsets: ['latin', 'latin-ext']})

export const metadata: Metadata = {}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={inter.className}>
      <body className="min-h-screen flex flex-col bg-cream">
        {children}
      </body>
    </html>
  )
}
