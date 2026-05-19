'use client'

import {useState, useEffect} from 'react'
import {useTranslations, useLocale} from 'next-intl'
import {useRouter} from 'next/navigation'
import {collection, doc, setDoc, getDoc, query, where, onSnapshot, serverTimestamp} from 'firebase/firestore'
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import {db, storage} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'

type Form = {
  firstName: string; lastName: string; dateOfBirth: string
  placeOfBirth: string; ageOct1: string; address: string; cityZip: string
  motherName: string; motherPhone: string; fatherName: string; fatherPhone: string
  emergencyPhone: string; email: string; englishGrade: string; polishGrade: string
  specialNeeds: string; parishMember: string; catechism: string
}

type MyChild = {id: string; firstName: string; lastName: string}
type ParentProfile = {firstName: string; lastName: string; email: string; phone: string; address?: string}

const EMPTY: Form = {
  firstName: '', lastName: '', dateOfBirth: '', placeOfBirth: '', ageOct1: '',
  address: '', cityZip: '', motherName: '', motherPhone: '', fatherName: '',
  fatherPhone: '', emergencyPhone: '', email: '', englishGrade: '', polishGrade: '',
  specialNeeds: '', parishMember: '', catechism: '',
}

const GRADES = ['Przedszkole','1','2','3','4','5','6','7','8','9','10','11','12']

// --- Sub-components outside the page to prevent focus loss ---

function SectionHeader({label}: {label: string}) {
  return (
    <h2 className="text-sm font-bold text-gold uppercase tracking-widest mt-8 mb-4 pb-1 border-b border-gray-100">
      {label}
    </h2>
  )
}

function Field({label, value, onChange, required = false, placeholder = '', type = 'text'}: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-gold ml-1">*</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
      />
    </div>
  )
}

function YesNo({label, value, onChange, yesLabel, noLabel}: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  yesLabel: string; noLabel: string
}) {
  return (
    <div>
      <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-4">
        {[{val: 'yes', text: yesLabel}, {val: 'no', text: noLabel}].map(({val, text}) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value={val} checked={value === val} onChange={onChange} className="accent-navy" />
            <span className="text-sm text-navy">{text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// --- PDF generation ---

async function generateAndUploadPDF(form: Form, signature: string, enrollmentId: string): Promise<string> {
  const {default: jsPDF} = await import('jspdf')
  const pdf = new jsPDF()
  const pageW = pdf.internal.pageSize.getWidth()
  let y = 20

  const section = (title: string) => {
    y += 4
    pdf.setFillColor(20, 40, 80)
    pdf.rect(14, y, pageW - 28, 7, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title.toUpperCase(), 17, y + 5)
    pdf.setTextColor(0, 0, 0)
    y += 12
  }

  const row = (label: string, value: string | undefined) => {
    if (y > 270) { pdf.addPage(); y = 20 }
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, 17, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value || '—', 80, y)
    y += 6
  }

  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(20, 40, 80)
  pdf.text('Formularz Rejestracji Ucznia 2026/2027', pageW / 2, y, {align: 'center'})
  y += 7
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(80, 80, 80)
  pdf.text('Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza — Plainfield, NJ', pageW / 2, y, {align: 'center'})
  pdf.setTextColor(0, 0, 0); y += 4

  section('Dane ucznia')
  row('Imię', form.firstName); row('Nazwisko', form.lastName)
  row('Data urodzenia', form.dateOfBirth); row('Miejsce urodzenia', form.placeOfBirth)
  row('Wiek (1 paź 2026)', form.ageOct1)

  section('Adres zamieszkania')
  row('Ulica i numer', form.address); row('Miasto / Kod', form.cityZip)

  section('Dane rodziców / opiekunów')
  row('Imię matki', form.motherName); row('Tel. matki', form.motherPhone)
  row('Imię ojca', form.fatherName); row('Tel. ojca', form.fatherPhone)
  row('Tel. awaryjny', form.emergencyPhone); row('Email', form.email)

  section('Informacje szkolne')
  row('Klasa angielska', form.englishGrade); row('Klasa polska', form.polishGrade)
  row('Uwagi / Alergie', form.specialNeeds || '—')

  section('Parafia')
  row('Przynależy do parafii', form.parishMember === 'yes' ? 'Tak' : 'Nie')
  row('Katechizacja', form.catechism === 'yes' ? 'Tak' : 'Nie')

  section('Podpis elektroniczny')
  pdf.setFontSize(10); pdf.setFont('helvetica', 'italic')
  pdf.text(signature, 17, y); y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 100, 100)
  pdf.text(`Podpisano elektronicznie dnia ${new Date().toLocaleDateString('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})}`, 17, y)
  pdf.text(`Nr zgłoszenia: ${enrollmentId}`, 17, y + 5)

  const blob = pdf.output('blob')
  const storageRef = ref(storage, `enrollments/${enrollmentId}/form.pdf`)
  await uploadBytes(storageRef, blob, {contentType: 'application/pdf'})
  return getDownloadURL(storageRef)
}

// --- Page ---

export default function EnrollPage() {
  const t = useTranslations('Enroll')
  const locale = useLocale()
  const router = useRouter()
  const {user, role, loading} = useAuth()

  const [myChildren, setMyChildren]       = useState<MyChild[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<MyChild | null>(null)
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null)

  const [form, setForm]             = useState<Form>(EMPTY)
  const [signature, setSignature]   = useState('')
  const [consent, setConsent]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/' + locale + '/login')
  }, [user, loading, router, locale])

  // Load parent's children
  useEffect(() => {
    if (!user || role !== 'parent') return
    const q = query(collection(db, 'children'), where('parentId', '==', user.uid))
    return onSnapshot(q, snap => {
      setMyChildren(snap.docs.map(d => ({
        id: d.id,
        firstName: d.data().firstName as string,
        lastName:  d.data().lastName  as string,
      })))
      setChildrenLoading(false)
    })
  }, [user, role])

  // Load parent profile for pre-filling contact info
  useEffect(() => {
    if (!user || role !== 'parent') return
    getDoc(doc(db, 'parents', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setParentProfile({
          firstName: d.firstName, lastName: d.lastName,
          email: d.email, phone: d.phone, address: d.address,
        })
      }
    })
  }, [user, role])

  if (loading || !user) return null

  function setField(field: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({...prev, [field]: e.target.value}))
  }

  function handleSelectChild(child: MyChild) {
    setSelectedChild(child)
    setForm(prev => ({
      ...prev,
      firstName: child.firstName,
      lastName:  child.lastName,
      // Pre-fill parent contact info from profile
      email:          parentProfile?.email   || prev.email,
      emergencyPhone: parentProfile?.phone   || prev.emergencyPhone,
      address:        parentProfile?.address || prev.address,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Parents must select a child from their profile
    if (role === 'parent' && !selectedChild) {
      setError(t('errorSelectChild'))
      return
    }

    const required: (keyof Form)[] = [
      'firstName','lastName','dateOfBirth','placeOfBirth','ageOct1',
      'address','cityZip','email','englishGrade','polishGrade',
    ]
    if (required.some(f => !form[f].trim())) { setError(t('errorRequired')); return }
    if (!consent)           { setError(t('errorConsent'));    return }
    if (!signature.trim())  { setError(t('errorSignature'));  return }

    setSubmitting(true)
    try {
      const enrollRef = doc(collection(db, 'enrollments'))
      setSubmitStatus('Generowanie PDF…')
      const pdfUrl = await generateAndUploadPDF(form, signature.trim(), enrollRef.id)
      setSubmitStatus('Zapisywanie…')
      await setDoc(enrollRef, {
        ...form,
        parishMember: form.parishMember === 'yes',
        catechism:    form.catechism    === 'yes',
        signature:    signature.trim(),
        uid:          user!.uid,
        childId:      selectedChild?.id ?? null,
        pdfUrl,
        status:       'pending',
        schoolYear:   '2026/2027',
        submittedAt:  serverTimestamp(),
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(t('errorSubmit'))
      setSubmitting(false)
      setSubmitStatus('')
    }
  }

  if (success) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-navy mb-3">{t('successTitle')}</h1>
          <p className="text-gray-500 mb-8">{t('successDesc')}</p>
          <Link href={'/' + locale} className="bg-gold text-navy font-bold px-6 py-3 rounded hover:bg-gold-light transition-colors text-sm">
            {t('successBack')}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-300 text-sm mt-2">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Child selector — only for parents */}
        {role === 'parent' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">
              {t('selectChildTitle')}
            </h2>

            {childrenLoading ? (
              <p className="text-sm text-gray-400">{t('loadingChildren')}</p>
            ) : myChildren.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">{t('noChildrenTitle')}</p>
                <p className="text-sm text-amber-700 mb-3">{t('noChildrenDesc')}</p>
                <Link href={'/' + locale + '/dashboard'}
                  className="inline-block bg-navy text-white text-xs font-bold px-4 py-2 rounded hover:bg-navy-dark transition-colors">
                  {t('goToDashboard')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {myChildren.map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-gold bg-gold/10 text-navy'
                        : 'border-gray-200 text-gray-600 hover:border-gold hover:text-navy'
                    }`}
                  >
                    <span className="text-lg">👤</span>
                    {child.firstName} {child.lastName}
                    {selectedChild?.id === child.id && <span className="text-gold ml-1">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hide form until child is selected (parents only) */}
        {role === 'parent' && myChildren.length > 0 && !selectedChild ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
            {t('selectChildPrompt')}
          </div>
        ) : (role === 'parent' && myChildren.length === 0) ? null : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">

              <SectionHeader label={t('sectionStudent')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('firstName')}    value={form.firstName}    onChange={setField('firstName')}    required />
                <Field label={t('lastName')}     value={form.lastName}     onChange={setField('lastName')}     required />
                <Field label={t('dateOfBirth')}  value={form.dateOfBirth}  onChange={setField('dateOfBirth')}  required placeholder={t('dateOfBirthPlaceholder')} />
                <Field label={t('placeOfBirth')} value={form.placeOfBirth} onChange={setField('placeOfBirth')} required />
                <Field label={t('ageOct1')}      value={form.ageOct1}      onChange={setField('ageOct1')}      required />
              </div>

              <SectionHeader label={t('sectionAddress')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('address')} value={form.address} onChange={setField('address')} required />
                <Field label={t('cityZip')} value={form.cityZip} onChange={setField('cityZip')} required />
              </div>

              <SectionHeader label={t('sectionParents')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('motherName')}     value={form.motherName}     onChange={setField('motherName')}     />
                <Field label={t('motherPhone')}    value={form.motherPhone}    onChange={setField('motherPhone')}    type="tel" />
                <Field label={t('fatherName')}     value={form.fatherName}     onChange={setField('fatherName')}     />
                <Field label={t('fatherPhone')}    value={form.fatherPhone}    onChange={setField('fatherPhone')}    type="tel" />
                <Field label={t('emergencyPhone')} value={form.emergencyPhone} onChange={setField('emergencyPhone')} type="tel" />
                <Field label={t('email')}          value={form.email}          onChange={setField('email')}          required type="email" />
              </div>

              <SectionHeader label={t('sectionSchool')} />
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                    {t('englishGrade')}<span className="text-gold ml-1">*</span>
                  </label>
                  <select value={form.englishGrade} onChange={setField('englishGrade')}
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold bg-white">
                    <option value="">—</option>
                    {GRADES.map(g => <option key={g} value={g}>{g === 'Przedszkole' ? g : `Grade ${g}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                    {t('polishGrade')}<span className="text-gold ml-1">*</span>
                  </label>
                  <select value={form.polishGrade} onChange={setField('polishGrade')}
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold bg-white">
                    <option value="">—</option>
                    {GRADES.map(g => <option key={g} value={g}>{g === 'Przedszkole' ? g : `Klasa ${g}`}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  {t('specialNeeds')}
                </label>
                <textarea
                  value={form.specialNeeds} onChange={setField('specialNeeds')}
                  rows={3} placeholder={t('specialNeedsPlaceholder')}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <SectionHeader label={t('sectionParish')} />
              <div className="space-y-4">
                <YesNo label={t('parishMember')} value={form.parishMember} onChange={setField('parishMember')} yesLabel={t('yes')} noLabel={t('no')} />
                <YesNo label={t('catechism')}    value={form.catechism}    onChange={setField('catechism')}    yesLabel={t('yes')} noLabel={t('no')} />
              </div>

              <SectionHeader label={t('sectionConsent')} />
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="accent-navy mt-0.5 shrink-0" />
                <span className="text-sm text-gray-600">{t('consentText')}</span>
              </label>

              <SectionHeader label={t('sectionSignature')} />
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  {t('signatureLabel')}<span className="text-gold ml-1">*</span>
                </label>
                <input
                  type="text" value={signature} onChange={e => setSignature(e.target.value)}
                  placeholder={t('signaturePlaceholder')}
                  className="w-full border-2 border-gray-300 rounded px-3 py-3 text-base italic focus:outline-none focus:border-navy"
                  style={{fontFamily: 'Georgia, serif'}}
                />
                <p className="text-xs text-gray-400 mt-2">{t('signatureHint')}</p>
              </div>

              {error && (
                <p className="mt-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={submitting}
                className="mt-8 w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
                {submitting ? (submitStatus || t('submitting')) : t('submitBtn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
