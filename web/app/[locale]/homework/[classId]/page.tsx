import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import {p} from '@/lib/navigation'

const classData = {
  'przedszkole': {labelKey: 'preschool', teacher: 'Pani Kowalska'},
  'klasa-1':     {labelKey: 'class1',    teacher: 'Pani Nowak'},
  'klasa-2':     {labelKey: 'class2',    teacher: 'Pan Wiśniewski'},
  'klasa-3':     {labelKey: 'class3',    teacher: 'Pani Wójcik'},
  'klasa-4':     {labelKey: 'class4',    teacher: 'Pani Kamińska'},
  'klasa-5':     {labelKey: 'class5',    teacher: 'Pan Kowalski'},
}

export default async function HomeworkPage({params}: {params: Promise<{locale: string; classId: string}>}) {
  const {locale, classId} = await params
  const tNav = await getTranslations({locale, namespace: 'Nav'})
  const t = await getTranslations({locale, namespace: 'Homework'})
  const cls = classData[classId as keyof typeof classData]

  if (!cls) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">{t('notFound')}</h1>
        <Link href={p(locale, '/')} className="text-gold hover:underline">{t('backHome')}</Link>
      </main>
    )
  }

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{tNav(cls.labelKey as any)}</h1>
          <p className="text-gray-300 mt-1 text-sm">{t('teacher')}: {cls.teacher}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(classData).map(([id, c]) => (
            <Link
              key={id}
              href={p(locale, `/homework/${id}`)}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                id === classId ? 'bg-navy text-white border-navy' : 'border-gray-200 text-navy hover:border-gold hover:text-gold bg-white'
              }`}
            >
              {tNav(c.labelKey as any)}
            </Link>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-semibold mb-1">{t('emptyTitle')}</p>
          <p className="text-amber-700 text-sm">{t('emptyDesc')}</p>
        </div>
      </div>
    </main>
  )
}
