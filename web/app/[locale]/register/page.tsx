'use client'

import {useState, useEffect} from 'react'
import {createUserWithEmailAndPassword} from 'firebase/auth'
import {doc, setDoc, serverTimestamp} from 'firebase/firestore'
import {auth, db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export default function RegisterPage() {
  const {user, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Register')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', password: '', confirm: '',
  })
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/' + locale + '/dashboard')
  }, [user, loading, router, locale])

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({...prev, [field]: e.target.value}))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError(t('errorPasswordMatch')); return }
    if (form.password.length < 6)       { setError(t('errorPasswordLength')); return }
    setSubmitting(true)
    try {
      const {user: newUser} = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, 'users', newUser.uid), {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        role:      'parent',
        createdAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'parents', newUser.uid), {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        address:   form.address.trim(),
        createdAt: serverTimestamp(),
      })
      router.replace('/' + locale + '/dashboard')
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? t('errorEmailInUse') : t('errorGeneric'))
      setSubmitting(false)
    }
  }

  if (loading) return null

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type} value={(form as any)[key]} onChange={set(key)}
        className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field(t('firstName') + ' *', 'firstName', 'text', 'Jan')}
            {field(t('lastName') + ' *', 'lastName', 'text', 'Kowalski')}
          </div>
          {field(t('email') + ' *', 'email', 'email', 'jan@email.com')}
          {field(t('phone') + ' *', 'phone', 'text', '+1 (732) 000-0000')}
          {field(t('address'), 'address', 'text', t('addressPlaceholder'))}
          {field(t('password') + ' *', 'password', 'password', t('passwordPlaceholder'))}
          {field(t('confirm') + ' *', 'confirm', 'password', '••••••••')}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm mt-2">
            {submitting ? t('submitting') : t('submitBtn')}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('hasAccount')}{' '}
            <Link href={'/' + locale + '/login'} className="text-gold font-semibold hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
