'use client'

import {useState, useEffect} from 'react'
import {signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const {user, role, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Login')

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
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
    } catch {
      setError(t('error'))
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              {t('emailLabel')}
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              {t('passwordLabel')}
            </label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
            {submitting ? t('submitting') : t('submitBtn')}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('noAccount')}{' '}
            <Link href={'/' + locale + '/register'} className="text-gold font-semibold hover:underline">
              {t('registerLink')}
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
