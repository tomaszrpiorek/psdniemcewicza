'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import {sendEmailVerification} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import Image from 'next/image'

export default function VerifyEmailPage() {
  const {user, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const [resent, setResent]     = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/' + locale + '/login')
  }, [user, loading, router, locale])

  // Poll every 4 seconds — reload user and check emailVerified
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      await user.reload()
      if (auth.currentUser?.emailVerified) {
        clearInterval(interval)
        router.replace('/' + locale + '/dashboard')
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [user, router, locale])

  async function handleResend() {
    if (!user) return
    setChecking(true)
    try {
      await sendEmailVerification(user)
      setResent(true)
    } finally {
      setChecking(false)
    }
  }

  if (loading || !user) return null

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-6 object-contain" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-navy mb-2">Sprawdź swoją skrzynkę</h1>
          <p className="text-gray-500 text-sm mb-1">
            Wysłaliśmy link weryfikacyjny na adres:
          </p>
          <p className="font-semibold text-navy text-sm mb-6">{user.email}</p>
          <p className="text-gray-400 text-xs mb-6">
            Kliknij link w wiadomości e-mail, aby potwierdzić konto. Ta strona odświeży się automatycznie.
          </p>

          {resent && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-100 rounded px-3 py-2 mb-4">
              Link weryfikacyjny został wysłany ponownie.
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={checking || resent}
            className="w-full border border-navy text-navy font-bold py-2.5 rounded hover:bg-navy hover:text-white transition-colors disabled:opacity-50 text-sm"
          >
            {checking ? 'Wysyłanie…' : 'Wyślij ponownie'}
          </button>

          <button
            onClick={() => { auth.signOut(); router.replace('/' + locale + '/login') }}
            className="w-full mt-3 text-gray-400 text-xs hover:underline"
          >
            Wyloguj się
          </button>
        </div>
      </div>
    </main>
  )
}
