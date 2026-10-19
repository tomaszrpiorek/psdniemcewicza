import type {Metadata} from 'next'
import '../globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {NextIntlClientProvider} from 'next-intl'
import {getMessages, getTranslations} from 'next-intl/server'
import {routing} from '@/i18n/routing'
import {notFound} from 'next/navigation'
import {AuthProvider} from '@/contexts/AuthContext'
import {SITE_URL} from '@/lib/seo'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Metadata'})
  return {
    metadataBase: new URL(SITE_URL),
    title: {default: t('title'), template: t('titleTemplate')},
    description: t('description'),
    openGraph: {
      siteName: t('title'),
      type: 'website',
      locale: locale === 'pl' ? 'pl_PL' : 'en_US',
      images: ['/logo-25-lat.png'],
    },
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
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
