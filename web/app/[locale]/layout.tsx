import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import '../globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {NextIntlClientProvider} from 'next-intl'
import {getMessages, getTranslations} from 'next-intl/server'
import {routing} from '@/i18n/routing'
import {notFound} from 'next/navigation'

const inter = Inter({subsets: ['latin', 'latin-ext']})

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Metadata'})
  return {
    title: t('title'),
    description: t('description'),
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{locale: string}>
}) {
  const {locale} = await params
  if (!routing.locales.includes(locale as any)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.className}>
      <body className="min-h-screen flex flex-col bg-cream">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
