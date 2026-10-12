'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {collection, query, where, orderBy, getDocs, limit} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {SCHOOL_GRADES} from '@/lib/grades'
import {homeworkAttachments, HomeworkAttachment} from '@/lib/homework'
import {IconPaperclip} from '@/components/icons'

type Homework = {
  id: string
  title: string
  weekOf?: string
  description?: string
  attachments?: HomeworkAttachment[]
  attachmentUrl?: string
  attachmentName?: string
}

export default function HomeworkPage() {
  const {locale, classId} = useParams<{locale: string; classId: string}>()
  const tNav = useTranslations('Nav')
  const t = useTranslations('Homework')

  const schoolGrade = SCHOOL_GRADES.find((g) => g.slug === classId)
  const levelNum = schoolGrade?.level ?? null
  const valid = schoolGrade !== undefined

  const [loading, setLoading]   = useState(true)
  const [gradeName, setGradeName] = useState('')
  const [teacherName, setTeacherName] = useState<string | undefined>()
  const [homework, setHomework] = useState<Homework[]>([])

  useEffect(() => {
    if (!valid) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const gradeSnap = await getDocs(
        query(collection(db, 'grades'), where('level', '==', levelNum), limit(1))
      )
      if (cancelled) return
      if (gradeSnap.empty) { setLoading(false); return }
      const grade = gradeSnap.docs[0]
      setGradeName(grade.data().name)
      setTeacherName(grade.data().teacherName)

      const hwSnap = await getDocs(
        query(collection(db, 'homework'), where('gradeId', '==', grade.id), orderBy('weekOf', 'desc'))
      )
      if (cancelled) return
      setHomework(hwSnap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Homework, 'id'>)})))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [valid, levelNum])

  if (!schoolGrade) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">{t('notFound')}</h1>
        <Link href={'/' + locale} className="text-gold hover:underline">{t('backHome')}</Link>
      </main>
    )
  }

  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{gradeName || tNav(schoolGrade.navKey)}</h1>
          {teacherName && <p className="text-gray-300 mt-1 text-sm">{t('teacher')}: {teacherName}</p>}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {SCHOOL_GRADES.map((g) => (
            <Link
              key={g.slug}
              href={'/' + locale + '/homework/' + g.slug}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                g.level === levelNum ? 'bg-navy text-white border-navy' : 'border-gray-200 text-navy hover:border-gold hover:text-gold bg-white'
              }`}
            >
              {tNav(g.navKey)}
            </Link>
          ))}
        </div>

        {loading ? null : homework.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-800 font-semibold mb-1">{t('emptyTitle')}</p>
            <p className="text-amber-700 text-sm">{t('emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homework.map((hw, i) => (
              <div key={hw.id} className={`bg-white rounded-lg shadow-sm p-5 ${
                i === 0 ? 'border-2 border-gold' : 'border border-gray-100'
              }`}>
                <div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {hw.weekOf && (
                        <p className="text-xs font-bold text-gold uppercase tracking-wider">
                          {t('dueDate')}: {new Date(hw.weekOf).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}
                        </p>
                      )}
                      {i === 0 && (
                        <span className="text-xs bg-gold text-navy font-bold px-2 py-0.5 rounded-full">
                          {t('latest')}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-navy">{hw.title}</h2>
                  </div>
                </div>
                {hw.description && (
                  <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{hw.description}</p>
                )}
                {homeworkAttachments(hw).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {homeworkAttachments(hw).map((a) => (
                      <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-navy-dark transition-colors max-w-full">
                        <IconPaperclip className="w-4 h-4 shrink-0" />
                        <span className="truncate">{a.name || t('attachment')}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
