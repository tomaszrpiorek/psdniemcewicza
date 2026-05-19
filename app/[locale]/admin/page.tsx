'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, deleteDoc, doc, setDoc, getDocs, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'

type Grade = {id: string; name: string; level: number; teacherName?: string}
type Child = {id: string; firstName: string; lastName: string; gradeId: string; parentId: string}
type Parent = {id: string; firstName: string; lastName: string; phone: string; email: string; uid?: string}
type Enrollment = {
  id: string; firstName: string; lastName: string; email: string
  polishGrade: string; englishGrade: string; status: string; uid?: string; childId?: string
  submittedAt: any; motherName?: string; fatherName?: string
  motherPhone?: string; fatherPhone?: string; address?: string
  cityZip?: string; dateOfBirth?: string; placeOfBirth?: string
  ageOct1?: string; emergencyPhone?: string; specialNeeds?: string
  parishMember?: boolean; catechism?: boolean; signature?: string; pdfUrl?: string
}
type MedicalForm = {
  id: string; firstName: string; lastName: string; dateOfBirth?: string
  uid?: string; childId?: string; pdfUrl?: string; signature?: string; submittedAt: any
  contact1Name?: string; contact1Phone?: string; contact1Relation?: string
  contact2Name?: string; contact2Phone?: string; contact2Relation?: string
  allergies?: string; medications?: string; conditions?: string
  doctorName?: string; doctorPhone?: string
  insuranceProvider?: string; insurancePolicyNumber?: string
  consentEmergencyTreatment?: boolean; consentPhotos?: boolean; consentFieldTrips?: boolean
}

const GRADE_DEFAULTS = [
  {level: 0,  name: 'Przedszkole'},
  {level: 1,  name: 'Klasa 1'},
  {level: 2,  name: 'Klasa 2'},
  {level: 3,  name: 'Klasa 3'},
  {level: 4,  name: 'Klasa 4'},
  {level: 5,  name: 'Klasa 5'},
  {level: 6,  name: 'Klasa 6'},
  {level: 7,  name: 'Klasa 7'},
  {level: 8,  name: 'Klasa 8'},
  {level: 9,  name: 'Klasa 9'},
  {level: 10, name: 'Klasa 10'},
  {level: 11, name: 'Klasa 11'},
  {level: 12, name: 'Klasa 12'},
]

export default function AdminPage() {
  const {user, role, superAdmin, loading, signOut} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const [grades, setGrades]           = useState<Grade[]>([])
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null)
  const [children, setChildren]       = useState<Child[]>([])
  const [parents, setParents]         = useState<Record<string, Parent>>({})
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [showAddChild, setShowAddChild] = useState(false)
  const [seeding, setSeeding]         = useState(false)
  const [tab, setTab]                 = useState<'students' | 'parents'>('students')
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([])
  const [medicalForms, setMedicalForms] = useState<MedicalForm[]>([])
  const [mainTab, setMainTab]           = useState<'classes' | 'enrollments' | 'medical'>('classes')
  const [expandedEnrollment, setExpandedEnrollment] = useState<string | null>(null)
  const [expandedMedical, setExpandedMedical]       = useState<string | null>(null)
  const [enrollFilter, setEnrollFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || role !== 'teacher')) {
      router.replace('/' + locale + '/login')
    }
  }, [user, role, loading, router, locale])

  // Load enrollments
  useEffect(() => {
    if (!user || role !== 'teacher') return
    const q = query(collection(db, 'enrollments'), orderBy('submittedAt', 'desc'))
    return onSnapshot(q, snap => {
      setEnrollments(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Enrollment, 'id'>)})))
    })
  }, [user, role])

  // Load medical forms
  useEffect(() => {
    if (!user || role !== 'teacher') return
    const q = query(collection(db, 'medicalForms'), orderBy('submittedAt', 'desc'))
    return onSnapshot(q, snap => {
      setMedicalForms(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<MedicalForm, 'id'>)})))
    })
  }, [user, role])

  // Load grades
  useEffect(() => {
    if (!user || role !== 'teacher') return
    const q = query(collection(db, 'grades'), orderBy('level'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Grade, 'id'>)}))
      setGrades(list)
      if (list.length > 0 && !activeGrade) setActiveGrade(list[0])
    })
  }, [user, role])

  // Load children for active grade
  useEffect(() => {
    if (!activeGrade || !user) return
    setChildren([])
    setSelected(new Set())
    const q = query(collection(db, 'children'), where('gradeId', '==', activeGrade.id))
    return onSnapshot(q, async snap => {
      const kids = snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Child, 'id'>)}))
      setChildren(kids)
      const uniqueParentIds = [...new Set(kids.map(k => k.parentId).filter(Boolean))]
      if (uniqueParentIds.length === 0) { setParents({}); return }
      const parentSnaps = await getDocs(query(
        collection(db, 'parents'),
        where('__name__', 'in', uniqueParentIds)
      ))
      const map: Record<string, Parent> = {}
      parentSnaps.forEach(d => { map[d.id] = {id: d.id, ...(d.data() as Omit<Parent, 'id'>)} })
      setParents(map)
    })
  }, [activeGrade, user])

  async function seedGrades() {
    if (!confirm('Inicjalizuj klasy Przedszkole – Klasa 12?')) return
    setSeeding(true)
    const batch = writeBatch(db)
    GRADE_DEFAULTS.forEach(g => {
      const ref = doc(collection(db, 'grades'))
      batch.set(ref, {...g, createdAt: serverTimestamp()})
    })
    await batch.commit()
    setSeeding(false)
  }

  async function handleDeleteChild(childId: string) {
    if (!confirm('Usunąć ucznia?')) return
    await deleteDoc(doc(db, 'children', childId))
  }

  async function updateEnrollmentStatus(id: string, status: string) {
    const {updateDoc} = await import('firebase/firestore')
    await updateDoc(doc(db, 'enrollments', id), {status})
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/' + locale + '/login')
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll() {
    setSelected(selected.size === children.length ? new Set() : new Set(children.map(c => c.id)))
  }

  if (loading || !user || role !== 'teacher') return null

  const pendingCount = enrollments.filter(e => e.status === 'pending').length
  const filteredEnrollments = enrollments.filter(e => enrollFilter === 'all' || e.status === enrollFilter)

  function childEnrollment(child: Child) {
    const byChildId = enrollments.find(e => e.childId === child.id)
    if (byChildId) return byChildId
    const parent = parents[child.parentId]
    if (!parent?.uid) return null
    return enrollments.find(e => e.uid === parent.uid) ?? null
  }

  function childMedicalForm(child: Child) {
    const byChildId = medicalForms.find(m => m.childId === child.id)
    if (byChildId) return byChildId
    const parent = parents[child.parentId]
    if (!parent?.uid) return null
    return medicalForms.find(m => m.uid === parent.uid) ?? null
  }

  return (
    <div className="flex min-h-[calc(100vh-180px)]">
      {/* Sidebar */}
      <aside className="w-52 bg-navy-dark shrink-0 py-6 px-3 space-y-1">
        <button
          onClick={() => setMainTab('classes')}
          className={`w-full text-left px-3 py-2 rounded text-sm font-bold mb-1 transition-colors ${mainTab === 'classes' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Klasy
        </button>
        <button
          onClick={() => setMainTab('enrollments')}
          className={`w-full text-left px-3 py-2 rounded text-sm font-bold transition-colors flex items-center justify-between ${mainTab === 'enrollments' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <span>Zapisy</span>
          {pendingCount > 0 && (
            <span className="bg-gold text-navy text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab('medical')}
          className={`w-full text-left px-3 py-2 rounded text-sm font-bold mb-3 transition-colors flex items-center justify-between ${mainTab === 'medical' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <span>Zgody med.</span>
          {medicalForms.length > 0 && (
            <span className="bg-blue-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {medicalForms.length}
            </span>
          )}
        </button>
        <div className={mainTab === 'classes' ? '' : 'opacity-30 pointer-events-none transition-opacity'}>
          <p className="text-gold text-xs font-bold uppercase tracking-widest px-3 mb-3">Klasy</p>
          {grades.length === 0 && superAdmin && (
            <button
              onClick={seedGrades}
              disabled={seeding}
              className="w-full text-left px-3 py-2 text-xs text-amber-400 border border-amber-400/30 rounded hover:bg-amber-400/10 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Inicjalizacja…' : '+ Inicjalizuj klasy'}
            </button>
          )}
          {grades.map(g => (
            <button
              key={g.id}
              onClick={() => { setActiveGrade(g); setTab('students') }}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeGrade?.id === g.id
                  ? 'bg-gold text-navy font-bold'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy">
              {mainTab === 'enrollments' ? 'Zapisy 2026/2027' : mainTab === 'medical' ? 'Zgody medyczne 2026/2027' : activeGrade ? activeGrade.name : 'Panel nauczyciela'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm border border-gray-200 text-gray-500 px-4 py-1.5 rounded hover:border-red-300 hover:text-red-500 transition-colors"
          >
            Wyloguj
          </button>
        </div>

        {mainTab === 'enrollments' ? (
          <>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
                const count = f === 'all' ? enrollments.length : enrollments.filter(e => e.status === f).length
                const label = f === 'all' ? 'Wszystkie' : f === 'pending' ? 'Oczekujące' : f === 'approved' ? 'Zatwierdzone' : 'Odrzucone'
                return (
                  <button
                    key={f}
                    onClick={() => setEnrollFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      enrollFilter === f ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>

            {filteredEnrollments.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-10 text-center text-gray-400 text-sm">
                Brak zgłoszeń.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEnrollments.map(e => (
                  <div key={e.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedEnrollment(expandedEnrollment === e.id ? null : e.id)}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="font-bold text-navy text-sm">{e.firstName} {e.lastName}</p>
                          <p className="text-xs text-gray-400">{e.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">PL: <strong>{e.polishGrade}</strong></span>
                        <span className="text-xs text-gray-500">EN: <strong>{e.englishGrade}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          e.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                          e.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-600'
                        }`}>
                          {e.status === 'pending' ? 'Oczekujące' : e.status === 'approved' ? 'Zatwierdzone' : 'Odrzucone'}
                        </span>
                        <span className="text-gray-400 text-xs">{expandedEnrollment === e.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedEnrollment === e.id && (
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
                          <InfoRow label="Data urodzenia"       val={e.dateOfBirth} />
                          <InfoRow label="Miejsce urodzenia"    val={e.placeOfBirth} />
                          <InfoRow label="Wiek (1 paź 2026)"   val={e.ageOct1} />
                          <InfoRow label="Adres"                val={e.address} />
                          <InfoRow label="Miasto / Kod"         val={e.cityZip} />
                          <InfoRow label="Imię matki"           val={e.motherName} />
                          <InfoRow label="Tel. matki"           val={e.motherPhone} />
                          <InfoRow label="Imię ojca"            val={e.fatherName} />
                          <InfoRow label="Tel. ojca"            val={e.fatherPhone} />
                          <InfoRow label="Tel. awaryjny"        val={e.emergencyPhone} />
                          <InfoRow label="Parafia"              val={e.parishMember ? 'Tak' : 'Nie'} />
                          <InfoRow label="Katechizacja"         val={e.catechism ? 'Tak' : 'Nie'} />
                          {e.specialNeeds && <InfoRow label="Uwagi" val={e.specialNeeds} />}
                        </div>
                        {e.signature && (
                          <div className="mb-4 pb-4 border-b border-gray-200">
                            <p className="text-xs text-gray-400 mb-1">Podpis elektroniczny</p>
                            <p className="font-serif italic text-navy text-base">{e.signature}</p>
                          </div>
                        )}
                        <div className="flex gap-3 flex-wrap">
                          {e.pdfUrl && (
                            <a href={e.pdfUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                              📄 Pobierz PDF
                            </a>
                          )}
                          {e.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => updateEnrollmentStatus(e.id, 'approved')}
                                className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-green-700 transition-colors"
                              >
                                ✓ Zatwierdź
                              </button>
                              <button
                                onClick={() => updateEnrollmentStatus(e.id, 'rejected')}
                                className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-600 transition-colors"
                              >
                                ✗ Odrzuć
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => updateEnrollmentStatus(e.id, 'pending')}
                              className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                            >
                              Cofnij do oczekujących
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : mainTab === 'medical' ? (
          <>
            {medicalForms.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-10 text-center text-gray-400 text-sm">
                Brak złożonych zgód medycznych.
              </div>
            ) : (
              <div className="space-y-3">
                {medicalForms.map(m => (
                  <div key={m.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedMedical(expandedMedical === m.id ? null : m.id)}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="font-bold text-navy text-sm">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-gray-400">{m.dateOfBirth || '—'}</p>
                        </div>
                        {m.consentEmergencyTreatment !== undefined && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.consentEmergencyTreatment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {m.consentEmergencyTreatment ? 'Upoważnienie: TAK' : 'Upoważnienie: NIE'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {m.pdfUrl && (
                          <a href={m.pdfUrl} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-gray-800 transition-colors">
                            📄 PDF
                          </a>
                        )}
                        <span className="text-gray-400 text-xs">{expandedMedical === m.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedMedical === m.id && (
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                          <InfoRow label="Kontakt 1"       val={m.contact1Name ? `${m.contact1Name} — ${m.contact1Phone || ''}${m.contact1Relation ? ` (${m.contact1Relation})` : ''}` : undefined} />
                          <InfoRow label="Kontakt 2"       val={m.contact2Name ? `${m.contact2Name} — ${m.contact2Phone || ''}${m.contact2Relation ? ` (${m.contact2Relation})` : ''}` : undefined} />
                          <InfoRow label="Lekarz"          val={m.doctorName ? `${m.doctorName}${m.doctorPhone ? `, ${m.doctorPhone}` : ''}` : undefined} />
                          <InfoRow label="Ubezpieczenie"   val={m.insuranceProvider ? `${m.insuranceProvider}${m.insurancePolicyNumber ? ` — ${m.insurancePolicyNumber}` : ''}` : undefined} />
                          <InfoRow label="Zgoda na zdjęcia"    val={m.consentPhotos !== undefined ? (m.consentPhotos ? 'Tak' : 'Nie') : undefined} />
                          <InfoRow label="Zgoda na wycieczki"  val={m.consentFieldTrips !== undefined ? (m.consentFieldTrips ? 'Tak' : 'Nie') : undefined} />
                        </div>
                        {m.allergies && <div className="mb-2"><span className="text-xs font-bold text-gray-500">Alergie: </span><span className="text-sm text-navy">{m.allergies}</span></div>}
                        {m.medications && <div className="mb-2"><span className="text-xs font-bold text-gray-500">Leki: </span><span className="text-sm text-navy">{m.medications}</span></div>}
                        {m.conditions && <div className="mb-2"><span className="text-xs font-bold text-gray-500">Schorzenia: </span><span className="text-sm text-navy">{m.conditions}</span></div>}
                        {m.signature && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-400 mb-1">Podpis elektroniczny</p>
                            <p className="font-serif italic text-navy text-base">{m.signature}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {!activeGrade ? (
              <p className="text-gray-400 text-sm">Wybierz klasę z panelu po lewej.</p>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-gray-200">
                  {(['students', 'parents'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                        tab === t ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'
                      }`}
                    >
                      {t === 'students' ? `Uczniowie (${children.length})` : 'Rodzice'}
                    </button>
                  ))}
                </div>

                {tab === 'students' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      {selected.size > 0 && (
                        <span className="text-xs bg-gold/10 text-gold border border-gold/30 px-3 py-1.5 rounded font-semibold">
                          {selected.size} zaznaczone
                        </span>
                      )}
                      <div className="ml-auto">
                        <button
                          onClick={() => setShowAddChild(true)}
                          className="bg-gold text-navy text-sm font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors"
                        >
                          + Dodaj ucznia
                        </button>
                      </div>
                    </div>

                    {children.length === 0 ? (
                      <div className="bg-white rounded-lg border border-gray-100 p-10 text-center text-gray-400 text-sm">
                        Brak uczniów w tej klasie.
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-4 py-3 w-10">
                                <input type="checkbox" checked={selected.size === children.length} onChange={toggleAll} className="accent-navy" />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Uczeń</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rodzic</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Formularz</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Zgoda med.</th>
                              <th className="px-4 py-3 w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {children.map(child => {
                              const p = parents[child.parentId]
                              const enroll  = childEnrollment(child)
                              const medical = childMedicalForm(child)
                              return (
                                <tr key={child.id} className={selected.has(child.id) ? 'bg-gold/5' : 'hover:bg-gray-50'}>
                                  <td className="px-4 py-3">
                                    <input type="checkbox" checked={selected.has(child.id)} onChange={() => toggleSelect(child.id)} className="accent-navy" />
                                  </td>
                                  <td className="px-4 py-3 font-medium text-navy">{child.firstName} {child.lastName}</td>
                                  <td className="px-4 py-3 text-gray-600">{p ? p.firstName + ' ' + p.lastName : '—'}</td>
                                  <td className="px-4 py-3 text-gray-600">{p?.phone || '—'}</td>
                                  <td className="px-4 py-3 text-gray-600">{p?.email || '—'}</td>
                                  <td className="px-4 py-3">
                                    {enroll ? (
                                      enroll.pdfUrl ? (
                                        <a href={enroll.pdfUrl} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition-colors">
                                          ✓ PDF
                                        </a>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                                          ✓ Złożony
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {medical ? (
                                      medical.pdfUrl ? (
                                        <a href={medical.pdfUrl} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                                          ✓ PDF
                                        </a>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                                          ✓ Złożona
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleDeleteChild(child.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                                      Usuń
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {tab === 'parents' && (
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                    {Object.keys(parents).length === 0 ? (
                      <p className="text-center text-gray-400 text-sm p-10">Brak rodziców powiązanych z tą klasą.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rodzic</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Adres</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {Object.values(parents).map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-navy">{p.firstName} {p.lastName}</td>
                              <td className="px-4 py-3 text-gray-600">{p.phone || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{p.email || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {showAddChild && activeGrade && (
        <AddChildModal
          gradeId={activeGrade.id}
          gradeName={activeGrade.name}
          onClose={() => setShowAddChild(false)}
        />
      )}
    </div>
  )
}

function InfoRow({label, val}: {label: string; val?: string | null}) {
  if (!val) return null
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className="text-navy font-medium">{val}</span>
    </div>
  )
}

function AddChildModal({gradeId, gradeName, onClose}: {gradeId: string; gradeName: string; onClose: () => void}) {
  const [childFirst, setChildFirst] = useState('')
  const [childLast, setChildLast]   = useState('')
  const [parentFirst, setParentFirst] = useState('')
  const [parentLast, setParentLast]   = useState('')
  const [phone, setPhone]             = useState('')
  const [email, setEmail]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!childFirst.trim() || !childLast.trim() || !parentFirst.trim() || !phone.trim()) {
      setError('Wypełnij wymagane pola.')
      return
    }
    setSaving(true)
    try {
      const parentRef = doc(collection(db, 'parents'))
      await setDoc(parentRef, {
        firstName: parentFirst.trim(),
        lastName:  parentLast.trim(),
        phone:     phone.trim(),
        email:     email.trim(),
        uid:       null,
        createdAt: serverTimestamp(),
      })
      await addDoc(collection(db, 'children'), {
        firstName: childFirst.trim(),
        lastName:  childLast.trim(),
        gradeId,
        parentId:  parentRef.id,
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch {
      setError('Błąd zapisu. Spróbuj ponownie.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-navy">Dodaj ucznia — {gradeName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Uczeń</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Imię *</label>
                <input value={childFirst} onChange={e => setChildFirst(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Maria" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nazwisko *</label>
                <input value={childLast} onChange={e => setChildLast(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Kowalska" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Rodzic / Opiekun</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Imię *</label>
                <input value={parentFirst} onChange={e => setParentFirst(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Jan" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nazwisko</label>
                <input value={parentLast} onChange={e => setParentLast(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="Kowalski" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefon *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="+1 (732) 000-0000" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  placeholder="jan@email.com" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
              Anuluj
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-navy text-white font-bold py-2 rounded text-sm hover:bg-navy-dark transition-colors disabled:opacity-60">
              {saving ? 'Zapisywanie…' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
