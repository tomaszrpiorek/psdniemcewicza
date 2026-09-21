'use client'

import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {sendPasswordResetEmail} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useLocale, useTranslations} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {zodResolver} from '@/lib/zodResolver'
import {requiredEmail} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import FormError from '@/components/form/FormError'

export default function ForgotPasswordPage() {
  const locale = useLocale()
  const t = useTranslations('ForgotPassword')
  const v = useTranslations('Validation')
  const [sent, setSent] = useState(false)

  const schema = z.object({
    email: requiredEmail(v('required'), v('invalidEmail')),
  })
  type FormValues = z.infer<typeof schema>

  const {
    register, handleSubmit, setError,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: {email: ''}})

  async function onSubmit(data: FormValues) {
    try {
      await sendPasswordResetEmail(auth, data.email)
      setSent(true)
    } catch (err) {
      const code = err instanceof Object && 'code' in err ? err.code : undefined
      // Don't reveal whether an account exists for this email.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSent(true)
      } else {
        setError('root', {message: t('error')})
      }
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm text-gray-600">{t('success')}</p>
              <Link href={'/' + locale + '/login'} className="inline-block mt-6 text-gold font-semibold hover:underline text-sm">
                {t('backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <TextField
                type="email" label={t('emailLabel')} placeholder={t('emailPlaceholder')}
                error={errors.email?.message} {...register('email')}
              />

              <FormError message={errors.root?.message} />

              <button type="submit" disabled={isSubmitting}
                className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
                {isSubmitting ? t('submitting') : t('submitBtn')}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href={'/' + locale + '/login'} className="text-gold font-semibold hover:underline">
                  {t('backToLogin')}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
