'use client'

import {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {zodResolver} from '@/lib/zodResolver'
import {requiredEmail} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import FormError from '@/components/form/FormError'

export default function LoginPage() {
  const {user, role, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Login')
  const v = useTranslations('Validation')

  const schema = z.object({
    email: requiredEmail(v('required'), v('invalidEmail')),
    password: z.string().min(1, v('required')),
  })
  type FormValues = z.infer<typeof schema>

  const {
    register, handleSubmit, setError,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: {email: '', password: ''}})

  useEffect(() => {
    if (!loading && user) {
      router.replace('/' + locale + (role === 'teacher' ? '/admin' : '/dashboard'))
    }
  }, [user, role, loading, router, locale])

  async function onSubmit(data: FormValues) {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
    } catch {
      setError('root', {message: t('error')})
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-5">
          <TextField
            type="email" label={t('emailLabel')} placeholder={t('emailPlaceholder')}
            error={errors.email?.message} {...register('email')}
          />
          <TextField
            type="password" label={t('passwordLabel')} placeholder={t('passwordPlaceholder')}
            error={errors.password?.message} {...register('password')}
          />
          <p className="text-right -mt-3">
            <Link href={'/' + locale + '/forgot-password'} className="text-xs text-gold font-semibold hover:underline">
              {t('forgotPasswordLink')}
            </Link>
          </p>

          <FormError message={errors.root?.message} />

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
            {isSubmitting ? t('submitting') : t('submitBtn')}
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
