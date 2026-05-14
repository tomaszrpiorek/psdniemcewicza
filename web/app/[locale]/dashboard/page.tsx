'use client'

import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import {useEffect} from 'react'

export default function DashboardPage() {
  const {user, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/' + locale + '/login')
    }
  }, [user, loading, router, locale])

  if (loading || !user) return null

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-navy mb-3">Portal rodzica</h1>
      <p className="text-gray-500">Wkrótce dostępne.</p>
    </main>
  )
}
