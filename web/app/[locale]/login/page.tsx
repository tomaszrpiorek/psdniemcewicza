'use client'

import {useState, useEffect} from 'react'
import {signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const {user, role, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/' + locale + (role === 'teacher' ? '/admin' : '/dashboard'))
    }
  }, [user, role, loading, router, locale])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // redirect handled by useEffect above
    } catch {
      setError('Nieprawidłowy email lub hasło.')
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">Zaloguj się</h1>
          <p className="text-gray-500 text-sm mt-1">Polska Szkoła Dokształcająca</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="adres@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Hasło
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm"
          >
            {submitting ? 'Logowanie…' : 'Zaloguj się'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Nie masz konta?{' '}
            <Link href={'/' + locale + '/register'} className="text-gold font-semibold hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
