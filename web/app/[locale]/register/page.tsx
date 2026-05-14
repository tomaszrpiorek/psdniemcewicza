'use client'

import {useState, useEffect} from 'react'
import {createUserWithEmailAndPassword} from 'firebase/auth'
import {doc, setDoc, serverTimestamp} from 'firebase/firestore'
import {auth, db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export default function RegisterPage() {
  const {user, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', password: '', confirm: '',
  })
  const [error, setError]       = useState('')
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
    if (form.password !== form.confirm) {
      setError('Hasła nie są zgodne.')
      return
    }
    if (form.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.')
      return
    }
    setSubmitting(true)
    try {
      const {user: newUser} = await createUserWithEmailAndPassword(auth, form.email, form.password)
      // Write auth role doc
      await setDoc(doc(db, 'users', newUser.uid), {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        role:      'parent',
        createdAt: serverTimestamp(),
      })
      // Write parent profile doc
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
      if (err.code === 'auth/email-already-in-use') {
        setError('Ten adres email jest już zarejestrowany.')
      } else {
        setError('Błąd rejestracji. Spróbuj ponownie.')
      }
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">Rejestracja rodzica</h1>
          <p className="text-gray-500 text-sm mt-1">Polska Szkoła Dokształcająca</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Imię *</label>
              <input required value={form.firstName} onChange={set('firstName')}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
                placeholder="Jan" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Nazwisko *</label>
              <input required value={form.lastName} onChange={set('lastName')}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
                placeholder="Kowalski" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Email *</label>
            <input required type="email" value={form.email} onChange={set('email')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="jan@email.com" />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Telefon *</label>
            <input required value={form.phone} onChange={set('phone')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="+1 (732) 000-0000" />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Adres</label>
            <input value={form.address} onChange={set('address')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="123 Main St, Plainfield, NJ" />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Hasło *</label>
            <input required type="password" value={form.password} onChange={set('password')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="minimum 6 znaków" />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Powtórz hasło *</label>
            <input required type="password" value={form.confirm} onChange={set('confirm')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="••••••••" />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm mt-2">
            {submitting ? 'Rejestracja…' : 'Zarejestruj się'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Masz już konto?{' '}
            <Link href={'/' + locale + '/login'} className="text-gold font-semibold hover:underline">
              Zaloguj się
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
