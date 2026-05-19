'use client'

import {useState, useEffect} from 'react'
import {useTranslations, useLocale} from 'next-intl'
import {useRouter} from 'next/navigation'
import {collection, doc, setDoc, getDoc, query, where, onSnapshot, serverTimestamp} from 'firebase/firestore'
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import {db, storage} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'

type MedicalForm = {
  firstName: string; lastName: string; dateOfBirth: string
  contact1Name: string; contact1Phone: string; contact1Relation: string
  contact2Name: string; contact2Phone: string; contact2Relation: string
  allergies: string; medications: string; conditions: string
  doctorName: string; doctorPhone: string
  insuranceProvider: string; insurancePolicyNumber: string
  consentEmergencyTreatment: string; consentPhotos: string; consentFieldTrips: string
}

type MyChild = {id: string; firstName: string; lastName: string}
type ParentProfile = {firstName: string; lastName: string; email: string; phone: string}

const EMPTY: MedicalForm = {
  firstName: '', lastName: '', dateOfBirth: '',
  contact1Name: '', contact1Phone: '', contact1Relation: '',
  contact2Name: '', contact2Phone: '', contact2Relation: '',
  allergies: '', medications: '', conditions: '',
  doctorName: '', doctorPhone: '',
  insuranceProvider: '', insurancePolicyNumber: '',
  consentEmergencyTreatment: '', consentPhotos: '', consentFieldTrips: '',
}

// --- Sub-components outside page to prevent focus loss ---

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

function TextArea({label, value, onChange, placeholder = ''}: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        value={value} onChange={onChange} rows={3} placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold resize-none"
      />
    </div>
  )
}

function YesNo({label, value, onChange, yesLabel, noLabel, required = false}: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  yesLabel: string; noLabel: string; required?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
        {label}{required && <span className="text-gold ml-1">*</span>}
      </p>
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

async function generateAndUploadPDF(form: MedicalForm, signature: string, docId: string): Promise<string> {
  const {default: jsPDF} = await import('jspdf')
  const pdf = new jsPDF()
  const pageW = pdf.internal.pageSize.getWidth()
  let y = 20

  const section = (title: string) => {
    y += 4
    pdf.setFillColor(20, 40, 80)
    pdf.rect(14, y, pageW - 28, 7, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
    pdf.text(title.toUpperCase(), 17, y + 5)
    pdf.setTextColor(0, 0, 0); y += 12
  }

  const row = (label: string, value: string | undefined) => {
    if (y > 270) { pdf.addPage(); y = 20 }
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
    pdf.text(label, 17, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value || '—', 90, y); y += 6
  }

  const block = (label: string, value: string | undefined) => {
    if (y > 250) { pdf.addPage(); y = 20 }
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
    pdf.text(label + ':', 17, y); y += 5
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(value || '—', pageW - 34)
    pdf.text(lines, 17, y); y += lines.length * 5 + 2
  }

  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(20, 40, 80)
  pdf.text('Zgoda Medyczna i Zwolnienie Rodzicielskie 2026/2027', pageW / 2, y, {align: 'center'})
  y += 7
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(80, 80, 80)
  pdf.text('Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza — Plainfield, NJ', pageW / 2, y, {align: 'center'})
  pdf.setTextColor(0, 0, 0); y += 4

  section('Dane ucznia')
  row('Imię i nazwisko', `${form.firstName} ${form.lastName}`)
  row('Data urodzenia', form.dateOfBirth)

  section('Kontakty awaryjne')
  row('Kontakt 1 — Imię', form.contact1Name)
  row('Kontakt 1 — Telefon', form.contact1Phone)
  row('Kontakt 1 — Relacja', form.contact1Relation)
  row('Kontakt 2 — Imię', form.contact2Name)
  row('Kontakt 2 — Telefon', form.contact2Phone)
  row('Kontakt 2 — Relacja', form.contact2Relation)

  section('Informacje medyczne')
  block('Alergie', form.allergies)
  block('Leki (nazwa, dawka, częstotliwość)', form.medications)
  block('Schorzenia / Choroby przewlekłe', form.conditions)
  row('Lekarz pierwszego kontaktu', form.doctorName)
  row('Telefon do lekarza', form.doctorPhone)
  row('Ubezpieczyciel', form.insuranceProvider)
  row('Nr polisy', form.insurancePolicyNumber)

  section('Zgody i upoważnienia')
  row('Upoważnienie do leczenia w nagłych przypadkach', form.consentEmergencyTreatment === 'yes' ? 'TAK' : 'NIE')
  row('Zgoda na zdjęcia / filmy dla celów szkolnych', form.consentPhotos === 'yes' ? 'TAK' : 'NIE')
  row('Zgoda na wycieczki szkolne', form.consentFieldTrips === 'yes' ? 'TAK' : 'NIE')

  section('Podpis elektroniczny')
  pdf.setFontSize(10); pdf.setFont('helvetica', 'italic')
  pdf.text(signature, 17, y); y += 6
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 100, 100)
  pdf.text(`Podpisano elektronicznie dnia ${new Date().toLocaleDateString('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})}`, 17, y)
  pdf.text(`Nr dokumentu: ${docId}`, 17, y + 5)

  const blob = pdf.output('blob')
  const storageRef = ref(storage, `medical/${docId}/form.pdf`)
  await uploadBytes(storageRef, blob, {contentType: 'application/pdf'})
  return getDownloadURL(storageRef)
}

// --- Page ---

export default function MedicalPage() {
  const t = useTranslations('Medical')
  const locale = useLocale()
  const router = useRouter()
  const {user, role, loading} = useAuth()

  const [myChildren, setMyChildren]           = useState<MyChild[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChild, setSelectedChild]     = useState<MyChild | null>(null)
  const [parentProfile, setParentProfile]     = useState<ParentProfile | null>(null)

  const [form, setForm]             = useState<MedicalForm>(EMPTY)
  const [signature, setSignature]   = useState('')
  const [consent, setConsent]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/' + locale + '/login')
  }, [user, loading, router, locale])

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

  useEffect(() => {
    if (!user || role !== 'parent') return
    getDoc(doc(db, 'parents', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setParentProfile({firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone})
      }
    })
  }, [user, role])

  if (loading || !user) return null

  function setField(field: keyof MedicalForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({...prev, [field]: e.target.value}))
  }

  function handleSelectChild(child: MyChild) {
    setSelectedChild(child)
    setForm(prev => ({
      ...prev,
      firstName:    child.firstName,
      lastName:     child.lastName,
      contact1Name: parentProfile ? `${parentProfile.firstName} ${parentProfile.lastName}` : prev.contact1Name,
      contact1Phone: parentProfile?.phone || prev.contact1Phone,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (role === 'parent' && !selectedChild) { setError(t('errorSelectChild')); return }
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth.trim()) { setError(t('errorRequired')); return }
    if (!form.contact1Name.trim() || !form.contact1Phone.trim()) { setError(t('errorContact')); return }
    if (!form.consentEmergencyTreatment) { setError(t('errorConsent')); return }
    if (!consent) { setError(t('errorConsentCheck')); return }
    if (!signature.trim()) { setError(t('errorSignature')); return }

    setSubmitting(true)
    try {
      const docRef = doc(collection(db, 'medicalForms'))
      setSubmitStatus(t('statusGenerating'))
      const pdfUrl = await generateAndUploadPDF(form, signature.trim(), docRef.id)
      setSubmitStatus(t('statusSaving'))
      await setDoc(docRef, {
        ...form,
        consentEmergencyTreatment: form.consentEmergencyTreatment === 'yes',
        consentPhotos:             form.consentPhotos             === 'yes',
        consentFieldTrips:         form.consentFieldTrips         === 'yes',
        signature: signature.trim(),
        uid:       user!.uid,
        childId:   selectedChild?.id ?? null,
        pdfUrl,
        schoolYear:  '2026/2027',
        submittedAt: serverTimestamp(),
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

        {/* Child selector */}
        {role === 'parent' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">{t('selectChildTitle')}</h2>
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
                  <button key={child.id} type="button" onClick={() => handleSelectChild(child)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-gold bg-gold/10 text-navy'
                        : 'border-gray-200 text-gray-600 hover:border-gold hover:text-navy'
                    }`}>
                    <span className="text-lg">👤</span>
                    {child.firstName} {child.lastName}
                    {selectedChild?.id === child.id && <span className="text-gold ml-1">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {role === 'parent' && myChildren.length > 0 && !selectedChild ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
            {t('selectChildPrompt')}
          </div>
        ) : (role === 'parent' && myChildren.length === 0) ? null : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">

              <SectionHeader label={t('sectionStudent')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('firstName')}   value={form.firstName}   onChange={setField('firstName')}   required />
                <Field label={t('lastName')}    value={form.lastName}    onChange={setField('lastName')}    required />
                <Field label={t('dateOfBirth')} value={form.dateOfBirth} onChange={setField('dateOfBirth')} required placeholder={t('dateOfBirthPlaceholder')} />
              </div>

              <SectionHeader label={t('sectionContacts')} />
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Field label={t('contact1Name')}     value={form.contact1Name}     onChange={setField('contact1Name')}     required />
                <Field label={t('contact1Phone')}    value={form.contact1Phone}    onChange={setField('contact1Phone')}    required type="tel" />
                <Field label={t('contact1Relation')} value={form.contact1Relation} onChange={setField('contact1Relation')} placeholder={t('relationPlaceholder')} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('contact2Name')}     value={form.contact2Name}     onChange={setField('contact2Name')}     />
                <Field label={t('contact2Phone')}    value={form.contact2Phone}    onChange={setField('contact2Phone')}    type="tel" />
                <Field label={t('contact2Relation')} value={form.contact2Relation} onChange={setField('contact2Relation')} placeholder={t('relationPlaceholder')} />
              </div>

              <SectionHeader label={t('sectionMedical')} />
              <div className="space-y-4">
                <TextArea label={t('allergies')}   value={form.allergies}   onChange={setField('allergies')}   placeholder={t('allergiesPlaceholder')} />
                <TextArea label={t('medications')} value={form.medications} onChange={setField('medications')} placeholder={t('medicationsPlaceholder')} />
                <TextArea label={t('conditions')}  value={form.conditions}  onChange={setField('conditions')}  placeholder={t('conditionsPlaceholder')} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label={t('doctorName')}          value={form.doctorName}          onChange={setField('doctorName')}          />
                <Field label={t('doctorPhone')}         value={form.doctorPhone}         onChange={setField('doctorPhone')}         type="tel" />
                <Field label={t('insuranceProvider')}   value={form.insuranceProvider}   onChange={setField('insuranceProvider')}   />
                <Field label={t('insurancePolicyNumber')} value={form.insurancePolicyNumber} onChange={setField('insurancePolicyNumber')} />
              </div>

              <SectionHeader label={t('sectionConsents')} />
              <div className="space-y-4">
                <YesNo label={t('consentEmergencyTreatment')} value={form.consentEmergencyTreatment} onChange={setField('consentEmergencyTreatment')} yesLabel={t('yes')} noLabel={t('no')} required />
                <YesNo label={t('consentPhotos')}             value={form.consentPhotos}             onChange={setField('consentPhotos')}             yesLabel={t('yes')} noLabel={t('no')} />
                <YesNo label={t('consentFieldTrips')}         value={form.consentFieldTrips}         onChange={setField('consentFieldTrips')}         yesLabel={t('yes')} noLabel={t('no')} />
              </div>

              <SectionHeader label={t('sectionConfirmation')} />
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
