'use client'

import {useState} from 'react'
import {httpsCallable} from 'firebase/functions'
import {functions} from '@/lib/firebase'
import {useTranslations} from 'next-intl'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const t = useTranslations('Contact')
  const [form, setForm]     = useState({name: '', email: '', message: ''})
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail')
      await sendContactEmail(form)
      setStatus('sent')
      setForm({name: '', email: '', message: ''})
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-navy font-bold">{t('sendSuccess')}</p>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">{t('nameLabel')}</label>
        <input
          type="text" required value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder={t('namePlaceholder')}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">{t('emailFormLabel')}</label>
        <input
          type="email" required value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">{t('messageLabel')}</label>
        <textarea
          required rows={5} value={form.message}
          onChange={(e) => setForm({...form, message: e.target.value})}
          className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
          placeholder={t('messagePlaceholder')}
        />
      </div>
      {status === 'error' && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{t('sendError')}</p>
      )}
      <button
        type="submit" disabled={status === 'sending'}
        className="w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('sendBtn')}
      </button>
    </form>
  )
}
