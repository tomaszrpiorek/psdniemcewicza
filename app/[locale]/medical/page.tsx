'use client'

import {useState, useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {useTranslations, useLocale} from 'next-intl'
import {useRouter} from 'next/navigation'
import {collection, doc, setDoc, getDoc, query, where, onSnapshot, serverTimestamp} from 'firebase/firestore'
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import {db, storage} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {zodResolver} from '@/lib/zodResolver'
import {requiredString, requiredName, requiredPhone, optionalName, optionalPhone} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import TextAreaField from '@/components/form/TextAreaField'
import RadioPills from '@/components/form/RadioPills'
import Checkbox from '@/components/form/Checkbox'
import FormError from '@/components/form/FormError'

type MyChild = {id: string; firstName: string; lastName: string}
type ParentProfile = {firstName: string; lastName: string; email: string; phone: string}

// --- Sub-components outside page to prevent focus loss ---

function SectionHeader({label}: {label: string}) {
  return (
    <h2 className="text-sm font-bold text-gold uppercase tracking-widest mt-8 mb-4 pb-1 border-b border-gray-100">
      {label}
    </h2>
  )
}

// --- PDF generation ---

async function generateAndUploadPDF(form: FormValues, signature: string, docId: string): Promise<string> {
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

// --- Schema ---

function buildSchema(t: ReturnType<typeof useTranslations>, v: ReturnType<typeof useTranslations>) {
  return z.object({
    firstName: requiredName(v('required'), v('invalidName')),
    lastName: requiredName(v('required'), v('invalidName')),
    dateOfBirth: requiredString(v('required')),
    contact1Name: requiredName(v('required'), v('invalidName')),
    contact1Phone: requiredPhone(v('required'), v('invalidPhone')),
    contact1Relation: z.string().trim().optional().default(''),
    contact2Name: optionalName(v('invalidName')),
    contact2Phone: optionalPhone(v('invalidPhone')),
    contact2Relation: z.string().trim().optional().default(''),
    allergies: z.string().trim().optional().default(''),
    medications: z.string().trim().optional().default(''),
    conditions: z.string().trim().optional().default(''),
    doctorName: optionalName(v('invalidName')),
    doctorPhone: optionalPhone(v('invalidPhone')),
    insuranceProvider: z.string().trim().optional().default(''),
    insurancePolicyNumber: z.string().trim().optional().default(''),
    consentEmergencyTreatment: requiredString(t('errorConsent')),
    consentPhotos: z.string().trim().optional().default(''),
    consentFieldTrips: z.string().trim().optional().default(''),
    consent: z.boolean().refine((val) => val, {message: t('errorConsentCheck')}),
    signature: requiredString(t('errorSignature')),
  })
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>

const EMPTY: FormValues = {
  firstName: '', lastName: '', dateOfBirth: '',
  contact1Name: '', contact1Phone: '', contact1Relation: '',
  contact2Name: '', contact2Phone: '', contact2Relation: '',
  allergies: '', medications: '', conditions: '',
  doctorName: '', doctorPhone: '',
  insuranceProvider: '', insurancePolicyNumber: '',
  consentEmergencyTreatment: '', consentPhotos: '', consentFieldTrips: '',
  consent: false, signature: '',
}

// --- Page ---

export default function MedicalPage() {
  const t = useTranslations('Medical')
  const v = useTranslations('Validation')
  const locale = useLocale()
  const router = useRouter()
  const {user, role, loading} = useAuth()

  const [myChildren, setMyChildren]           = useState<MyChild[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChild, setSelectedChild]     = useState<MyChild | null>(null)
  const [parentProfile, setParentProfile]     = useState<ParentProfile | null>(null)
  const [submitStatus, setSubmitStatus] = useState('')
  const [success, setSuccess] = useState(false)

  const schema = buildSchema(t, v)
  const {
    register, handleSubmit, setValue, setError,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY})

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

  function handleSelectChild(child: MyChild) {
    setSelectedChild(child)
    setValue('firstName', child.firstName)
    setValue('lastName', child.lastName)
    if (parentProfile) setValue('contact1Name', `${parentProfile.firstName} ${parentProfile.lastName}`)
    if (parentProfile?.phone) setValue('contact1Phone', parentProfile.phone)
  }

  async function onSubmit(data: FormValues) {
    if (role === 'parent' && !selectedChild) {
      setError('root', {message: t('errorSelectChild')})
      return
    }
    try {
      const docRef = doc(collection(db, 'medicalForms'))
      setSubmitStatus(t('statusGenerating'))
      const pdfUrl = await generateAndUploadPDF(data, data.signature, docRef.id)
      setSubmitStatus(t('statusSaving'))
      await setDoc(docRef, {
        ...data,
        consentEmergencyTreatment: data.consentEmergencyTreatment === 'yes',
        consentPhotos:             data.consentPhotos             === 'yes',
        consentFieldTrips:         data.consentFieldTrips         === 'yes',
        uid:       user!.uid,
        childId:   selectedChild?.id ?? null,
        pdfUrl,
        schoolYear:  '2026/2027',
        submittedAt: serverTimestamp(),
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError('root', {message: t('errorSubmit')})
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
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">

              <SectionHeader label={t('sectionStudent')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label={t('firstName')} required error={errors.firstName?.message} {...register('firstName')} />
                <TextField label={t('lastName')} required error={errors.lastName?.message} {...register('lastName')} />
                <TextField type="date" label={t('dateOfBirth')} required error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
              </div>

              <SectionHeader label={t('sectionContacts')} />
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <TextField label={t('contact1Name')} required error={errors.contact1Name?.message} {...register('contact1Name')} />
                <TextField type="tel" label={t('contact1Phone')} required error={errors.contact1Phone?.message} {...register('contact1Phone')} />
                <TextField label={t('contact1Relation')} placeholder={t('relationPlaceholder')} error={errors.contact1Relation?.message} {...register('contact1Relation')} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label={t('contact2Name')} error={errors.contact2Name?.message} {...register('contact2Name')} />
                <TextField type="tel" label={t('contact2Phone')} error={errors.contact2Phone?.message} {...register('contact2Phone')} />
                <TextField label={t('contact2Relation')} placeholder={t('relationPlaceholder')} error={errors.contact2Relation?.message} {...register('contact2Relation')} />
              </div>

              <SectionHeader label={t('sectionMedical')} />
              <div className="space-y-4">
                <TextAreaField label={t('allergies')} placeholder={t('allergiesPlaceholder')} error={errors.allergies?.message} {...register('allergies')} />
                <TextAreaField label={t('medications')} placeholder={t('medicationsPlaceholder')} error={errors.medications?.message} {...register('medications')} />
                <TextAreaField label={t('conditions')} placeholder={t('conditionsPlaceholder')} error={errors.conditions?.message} {...register('conditions')} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <TextField label={t('doctorName')} error={errors.doctorName?.message} {...register('doctorName')} />
                <TextField type="tel" label={t('doctorPhone')} error={errors.doctorPhone?.message} {...register('doctorPhone')} />
                <TextField label={t('insuranceProvider')} error={errors.insuranceProvider?.message} {...register('insuranceProvider')} />
                <TextField label={t('insurancePolicyNumber')} error={errors.insurancePolicyNumber?.message} {...register('insurancePolicyNumber')} />
              </div>

              <SectionHeader label={t('sectionConsents')} />
              <div className="space-y-4">
                <RadioPills label={t('consentEmergencyTreatment')} required name="consentEmergencyTreatment" register={register} yesLabel={t('yes')} noLabel={t('no')} error={errors.consentEmergencyTreatment?.message} />
                <RadioPills label={t('consentPhotos')} name="consentPhotos" register={register} yesLabel={t('yes')} noLabel={t('no')} />
                <RadioPills label={t('consentFieldTrips')} name="consentFieldTrips" register={register} yesLabel={t('yes')} noLabel={t('no')} />
              </div>

              <SectionHeader label={t('sectionConfirmation')} />
              <Checkbox label={t('consentText')} error={errors.consent?.message} {...register('consent')} />

              <SectionHeader label={t('sectionSignature')} />
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  {t('signatureLabel')}<span className="text-gold ml-1">*</span>
                </label>
                <input
                  type="text" placeholder={t('signaturePlaceholder')}
                  className="w-full border-2 border-gray-300 rounded px-3 py-3 text-base italic focus:outline-none focus:border-navy"
                  style={{fontFamily: 'Georgia, serif'}}
                  {...register('signature')}
                />
                {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
                <p className="text-xs text-gray-400 mt-2">{t('signatureHint')}</p>
              </div>

              <FormError message={errors.root?.message} />

              <button type="submit" disabled={isSubmitting}
                className="mt-8 w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
                {isSubmitting ? (submitStatus || t('submitting')) : t('submitBtn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
