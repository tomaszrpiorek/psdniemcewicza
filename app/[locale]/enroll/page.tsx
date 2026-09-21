'use client'

import {useState, useEffect} from 'react'
import {useForm, Controller} from 'react-hook-form'
import {z} from 'zod'
import {useTranslations, useLocale} from 'next-intl'
import {useRouter} from 'next/navigation'
import {collection, doc, setDoc, getDoc, query, where, onSnapshot, serverTimestamp} from 'firebase/firestore'
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import {db, storage} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {zodResolver} from '@/lib/zodResolver'
import {requiredCityZip, requiredEmail, requiredName, requiredString, optionalName, optionalPhone} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import TextAreaField from '@/components/form/TextAreaField'
import Select from '@/components/form/Select'
import RadioPills from '@/components/form/RadioPills'
import Checkbox from '@/components/form/Checkbox'
import FormError from '@/components/form/FormError'

type MyChild = {id: string; firstName: string; lastName: string}
type ParentProfile = {firstName: string; lastName: string; email: string; phone: string; address?: string}

const GRADES = ['Przedszkole', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// --- Sub-components outside the page to prevent focus loss ---

function SectionHeader({label}: {label: string}) {
  return (
    <h2 className="text-sm font-bold text-gold uppercase tracking-widest mt-8 mb-4 pb-1 border-b border-gray-100">
      {label}
    </h2>
  )
}

// --- PDF generation ---

async function generateAndUploadPDF(form: FormValues, signature: string, enrollmentId: string): Promise<string> {
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

// --- Schema ---

function buildSchema(t: ReturnType<typeof useTranslations>, v: ReturnType<typeof useTranslations>) {
  return z.object({
    firstName: requiredName(v('required'), v('invalidName')),
    lastName: requiredName(v('required'), v('invalidName')),
    dateOfBirth: requiredString(v('required')),
    placeOfBirth: requiredString(v('required')),
    ageOct1: requiredString(v('required')),
    address: requiredString(v('required'), 5, v('tooShort')),
    cityZip: requiredCityZip(v('required'), v('invalidZip')),
    motherName: optionalName(v('invalidName')),
    motherPhone: optionalPhone(v('invalidPhone')),
    fatherName: optionalName(v('invalidName')),
    fatherPhone: optionalPhone(v('invalidPhone')),
    emergencyPhone: optionalPhone(v('invalidPhone')),
    email: requiredEmail(v('required'), v('invalidEmail')),
    englishGrade: requiredString(v('required')),
    polishGrade: requiredString(v('required')),
    specialNeeds: z.string().trim().optional().default(''),
    parishMember: z.string().trim().optional().default(''),
    catechism: z.string().trim().optional().default(''),
    consent: z.boolean().refine((val) => val, {message: t('errorConsent')}),
    signature: requiredString(t('errorSignature')),
  })
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>

const EMPTY: FormValues = {
  firstName: '', lastName: '', dateOfBirth: '', placeOfBirth: '', ageOct1: '',
  address: '', cityZip: '', motherName: '', motherPhone: '', fatherName: '',
  fatherPhone: '', emergencyPhone: '', email: '', englishGrade: '', polishGrade: '',
  specialNeeds: '', parishMember: '', catechism: '', consent: false, signature: '',
}

// --- Page ---

export default function EnrollPage() {
  const t = useTranslations('Enroll')
  const v = useTranslations('Validation')
  const locale = useLocale()
  const router = useRouter()
  const {user, role, loading} = useAuth()

  const [myChildren, setMyChildren]       = useState<MyChild[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<MyChild | null>(null)
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null)
  const [submitStatus, setSubmitStatus] = useState('')
  const [success, setSuccess] = useState(false)

  const schema = buildSchema(t, v)
  const {
    register, handleSubmit, control, setValue, setError,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY})

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

  function handleSelectChild(child: MyChild) {
    setSelectedChild(child)
    setValue('firstName', child.firstName)
    setValue('lastName', child.lastName)
    if (parentProfile?.email) setValue('email', parentProfile.email)
    if (parentProfile?.phone) setValue('emergencyPhone', parentProfile.phone)
    if (parentProfile?.address) setValue('address', parentProfile.address)
  }

  async function onSubmit(data: FormValues) {
    if (role === 'parent' && !selectedChild) {
      setError('root', {message: t('errorSelectChild')})
      return
    }
    try {
      const enrollRef = doc(collection(db, 'enrollments'))
      setSubmitStatus('Generowanie PDF…')
      const pdfUrl = await generateAndUploadPDF(data, data.signature, enrollRef.id)
      setSubmitStatus('Zapisywanie…')
      await setDoc(enrollRef, {
        ...data,
        parishMember: data.parishMember === 'yes',
        catechism:    data.catechism    === 'yes',
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">

              <SectionHeader label={t('sectionStudent')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label={t('firstName')} required error={errors.firstName?.message} {...register('firstName')} />
                <TextField label={t('lastName')} required error={errors.lastName?.message} {...register('lastName')} />
                <TextField type="date" label={t('dateOfBirth')} required error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
                <TextField label={t('placeOfBirth')} required error={errors.placeOfBirth?.message} {...register('placeOfBirth')} />
                <TextField label={t('ageOct1')} required error={errors.ageOct1?.message} {...register('ageOct1')} />
              </div>

              <SectionHeader label={t('sectionAddress')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label={t('address')} required error={errors.address?.message} {...register('address')} />
                <TextField label={t('cityZip')} required error={errors.cityZip?.message} {...register('cityZip')} />
              </div>

              <SectionHeader label={t('sectionParents')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label={t('motherName')} error={errors.motherName?.message} {...register('motherName')} />
                <TextField type="tel" label={t('motherPhone')} error={errors.motherPhone?.message} {...register('motherPhone')} />
                <TextField label={t('fatherName')} error={errors.fatherName?.message} {...register('fatherName')} />
                <TextField type="tel" label={t('fatherPhone')} error={errors.fatherPhone?.message} {...register('fatherPhone')} />
                <TextField type="tel" label={t('emergencyPhone')} error={errors.emergencyPhone?.message} {...register('emergencyPhone')} />
                <TextField type="email" label={t('email')} required error={errors.email?.message} {...register('email')} />
              </div>

              <SectionHeader label={t('sectionSchool')} />
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Controller
                  control={control}
                  name="englishGrade"
                  render={({field}) => (
                    <Select
                      label={t('englishGrade')} required
                      value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                      error={errors.englishGrade?.message}
                      options={GRADES.map(g => ({value: g, label: g === 'Przedszkole' ? g : `Grade ${g}`}))}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="polishGrade"
                  render={({field}) => (
                    <Select
                      label={t('polishGrade')} required
                      value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                      error={errors.polishGrade?.message}
                      options={GRADES.map(g => ({value: g, label: g === 'Przedszkole' ? g : `Klasa ${g}`}))}
                    />
                  )}
                />
              </div>
              <TextAreaField
                label={t('specialNeeds')} rows={3} placeholder={t('specialNeedsPlaceholder')}
                error={errors.specialNeeds?.message} {...register('specialNeeds')}
              />

              <SectionHeader label={t('sectionParish')} />
              <div className="space-y-4">
                <RadioPills label={t('parishMember')} name="parishMember" register={register} yesLabel={t('yes')} noLabel={t('no')} />
                <RadioPills label={t('catechism')} name="catechism" register={register} yesLabel={t('yes')} noLabel={t('no')} />
              </div>

              <SectionHeader label={t('sectionConsent')} />
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
