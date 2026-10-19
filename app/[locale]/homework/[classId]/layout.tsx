import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'
import {SCHOOL_GRADES} from '@/lib/grades'
import {pageMetadata} from '@/lib/seo'

// The page itself is a client component, so its metadata lives here.
export async function generateMetadata({params}: {params: Promise<{locale: string; classId: string}>}): Promise<Metadata> {
  const {locale, classId} = await params
  const grade = SCHOOL_GRADES.find((g) => g.slug === classId)
  if (!grade) return {robots: {index: false}}
  const tNav = await getTranslations({locale, namespace: 'Nav'})
  const m = await getTranslations({locale, namespace: 'Metadata'})
  const name = tNav(grade.navKey)
  return pageMetadata(locale, `/homework/${grade.slug}`, m('homeworkTitle', {grade: name}), m('homeworkDescription', {grade: name}))
}

export default function Layout({children}: {children: React.ReactNode}) {
  return children
}
