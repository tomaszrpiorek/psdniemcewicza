'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, serverTimestamp,
} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {ENROLLMENT_OPEN} from '@/lib/features'

type Grade          = {id: string; name: string; level: number}
type Child          = {id: string; firstName: string; lastName: string; gradeId: string}
type ParentProfile  = {firstName: string; lastName: string; email: string; phone: string; address: string}
type EnrollDoc      = {id: string; status: string; childId?: string; pdfUrl?: string}
type MedicalDoc     = {id: string; childId?: string; pdfUrl?: string}
type TFn            = ReturnType<typeof useTranslations>

export default function DashboardPage() {
  const {user, loading, signOut} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Dashboard')

  const [profile, setProfile]     = useState<ParentProfile | null>(null)
  const [children, setChildren]   = useState<Child[]>([])
  const [grades, setGrades]       = useState<Grade[]>([])
  const [enrollments, setEnrollments] = useState<EnrollDoc[]>([])
  const [medicalForms, setMedicalForms] = useState<MedicalDoc[]>([])
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [showAdd, setShowAdd]     = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/' + locale + '/login'); return }
    if (!user.emailVerified) { router.replace('/' + locale + '/verify-email'); return }
  }, [user, loading, router, locale])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'parents', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as ParentProfile)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'grades'), orderBy('level'))).then(snap => {
      setGrades(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Grade, 'id'>)})))
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'children'), where('parentId', '==', user.uid))
    return onSnapshot(q, snap => {
      setChildren(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Child, 'id'>)})))
    })
  }, [user])

  // Load this parent's enrollment submissions
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'enrollments'), where('uid', '==', user.uid))
    return onSnapshot(q, snap => {
      setEnrollments(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<EnrollDoc, 'id'>)})))
    })
  }, [user])

  // Load this parent's medical form submissions
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'medicalForms'), where('uid', '==', user.uid))
    return onSnapshot(q, snap => {
      setMedicalForms(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<MedicalDoc, 'id'>)})))
    })
  }, [user])

  async function handleDelete(childId: string, name: string) {
    if (!confirm(t('deleteConfirm', {name}))) return
    await deleteDoc(doc(db, 'children', childId))
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/' + locale + '/login')
  }

  function gradeName(gradeId: string) {
    return grades.find(g => g.id === gradeId)?.name ?? '—'
  }

  function childEnrollment(childId: string): EnrollDoc | null {
    // Accurate match by childId
    const byChild = enrollments.find(e => e.childId === childId)
    if (byChild) return byChild
    // Fallback: single child + single enrollment must belong together
    if (children.length === 1 && enrollments.length >= 1) return enrollments[0]
    return null
  }

  function childMedical(childId: string): MedicalDoc | null {
    const byChild = medicalForms.find(m => m.childId === childId)
    if (byChild) return byChild
    if (children.length === 1 && medicalForms.length >= 1) return medicalForms[0]
    return null
  }

  if (loading || !user) return null

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {profile ? profile.firstName + ' ' + profile.lastName : user.email}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
        <button onClick={handleSignOut}
          className="text-sm border border-gray-200 text-gray-500 px-4 py-1.5 rounded hover:border-red-300 hover:text-red-500 transition-colors">
          {t('signOut')}
        </button>
      </div>

      {profile && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">{t('profileTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">{t('profileName')}</span><p className="font-medium text-navy">{profile.firstName} {profile.lastName}</p></div>
            <div><span className="text-gray-400">{t('profilePhone')}</span><p className="font-medium text-navy">{profile.phone || '—'}</p></div>
            <div><span className="text-gray-400">{t('profileEmail')}</span><p className="font-medium text-navy">{profile.email}</p></div>
            <div><span className="text-gray-400">{t('profileAddress')}</span><p className="font-medium text-navy">{profile.address || '—'}</p></div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">
            {t('childrenTitle')}
            <span className="ml-2 text-sm font-normal text-gray-400">({children.length})</span>
          </h2>
          <button onClick={() => setShowAdd(true)}
            className="bg-gold text-navy text-sm font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors">
            {t('addChild')}
          </button>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            {t('noChildren')}<br />{t('noChildrenHint')}
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => {
              const enroll  = childEnrollment(child.id)
              const medical = childMedical(child.id)
              return (
                <div key={child.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
                  {/* Child header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-navy text-lg">{child.firstName} {child.lastName}</p>
                      <p className="text-sm text-gray-500">{gradeName(child.gradeId)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setEditingChild(child)} className="text-sm text-gold font-semibold hover:underline">
                        {t('editBtn')}
                      </button>
                      <button onClick={() => handleDelete(child.id, child.firstName)} className="text-sm text-red-400 hover:text-red-600 transition-colors">
                        {t('deleteBtn')}
                      </button>
                    </div>
                  </div>

                  {/* Form statuses */}
                  <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-3">
                    {ENROLLMENT_OPEN && (
                      <FormStatus
                        label={t('enrollLabel')}
                        status={enroll ? enroll.status : null}
                        pdfUrl={enroll?.pdfUrl}
                        submitHref={'/' + locale + '/enroll'}
                        t={t}
                        type="enroll"
                      />
                    )}
                    <FormStatus
                      label={t('medicalLabel')}
                      status={medical ? 'submitted' : null}
                      pdfUrl={medical?.pdfUrl}
                      submitHref={'/' + locale + '/medical'}
                      t={t}
                      type="medical"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <ChildModal parentId={user.uid} grades={grades} t={t} onClose={() => setShowAdd(false)} />
      )}
      {editingChild && (
        <ChildModal parentId={user.uid} grades={grades} existing={editingChild} t={t} onClose={() => setEditingChild(null)} />
      )}
    </main>
  )
}

function FormStatus({label, status, pdfUrl, submitHref, t, type}: {
  label: string
  status: string | null
  pdfUrl?: string
  submitHref: string
  t: TFn
  type: 'enroll' | 'medical'
}) {
  const config = {
    enroll: {
      pending:   {bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400'},
      approved:  {bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500'},
      rejected:  {bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'},
      submitted: {bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500'},
      missing:   {bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   dot: 'bg-gray-300'},
    },
    medical: {
      submitted: {bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400'},
      missing:   {bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   dot: 'bg-gray-300'},
      pending:   {bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400'},
      approved:  {bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400'},
      rejected:  {bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   dot: 'bg-gray-300'},
    },
  }

  const key = (status ?? 'missing') as keyof typeof config.enroll
  const style = config[type][key] ?? config[type].missing

  const statusLabel = () => {
    if (!status) return t('statusMissing')
    if (type === 'medical') return t('statusSubmitted')
    if (status === 'pending')  return t('statusPending')
    if (status === 'approved') return t('statusApproved')
    if (status === 'rejected') return t('statusRejected')
    return t('statusSubmitted')
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${style.bg} ${style.border} text-xs`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <div>
        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">{label}</p>
        <p className={`font-semibold ${style.text}`}>{statusLabel()}</p>
      </div>
      {!status ? (
        (type !== 'enroll' || ENROLLMENT_OPEN) && (
          <Link href={submitHref} className="ml-2 text-navy font-bold hover:text-gold transition-colors shrink-0">
            {t('submitNow')}
          </Link>
        )
      ) : pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
          className={`ml-2 font-bold hover:underline shrink-0 ${style.text}`}>
          PDF →
        </a>
      ) : null}
    </div>
  )
}

function ChildModal({parentId, grades, existing, t, onClose}: {
  parentId: string
  grades: Grade[]
  existing?: Child
  t: TFn
  onClose: () => void
}) {
  const [firstName, setFirstName] = useState(existing?.firstName ?? '')
  const [lastName, setLastName]   = useState(existing?.lastName ?? '')
  const [gradeId, setGradeId]     = useState(existing?.gradeId ?? grades[0]?.id ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const isEdit = !!existing

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError(t('errorFillName')); return }
    if (!gradeId)                              { setError(t('errorNoGrade'));  return }
    setSaving(true)
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'children', existing!.id), {
          firstName: firstName.trim(), lastName: lastName.trim(), gradeId,
        })
      } else {
        await addDoc(collection(db, 'children'), {
          firstName: firstName.trim(), lastName: lastName.trim(),
          gradeId, parentId, createdAt: serverTimestamp(),
        })
      }
      onClose()
    } catch {
      setError(t('errorSave'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-navy">{isEdit ? t('modalEditTitle') : t('modalAddTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">{t('childFirstName')} *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold" placeholder="Maria" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">{t('childLastName')} *</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold" placeholder="Kowalska" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">{t('gradeLabel')} *</label>
            {grades.length === 0 ? (
              <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {t('noGrades')}
              </p>
            ) : (
              <select value={gradeId} onChange={e => setGradeId(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white">
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
              {t('cancelBtn')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-navy text-white font-bold py-2 rounded text-sm hover:bg-navy-dark transition-colors disabled:opacity-60">
              {saving ? t('savingBtn') : isEdit ? t('saveBtn') : t('addBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
