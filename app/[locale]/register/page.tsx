'use client'

import {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {createUserWithEmailAndPassword, sendEmailVerification} from 'firebase/auth'
import {doc, setDoc, serverTimestamp} from 'firebase/firestore'
import {auth, db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {zodResolver} from '@/lib/zodResolver'
import {requiredEmail, requiredName, requiredPhone} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import FormError from '@/components/form/FormError'

export default function RegisterPage() {
  const {user, loading} = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Register')
  const v = useTranslations('Validation')

  const schema = z
    .object({
      firstName: requiredName(v('required'), v('invalidName')),
      lastName: requiredName(v('required'), v('invalidName')),
      email: requiredEmail(v('required'), v('invalidEmail')),
      phone: requiredPhone(v('required'), v('invalidPhone')),
      address: z.string().trim().optional().default(''),
      password: z.string().min(8, v('passwordTooShort')),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: v('passwordMismatch'),
      path: ['confirm'],
    })
  type FormValues = z.infer<typeof schema>

  const {
    register, handleSubmit, setError,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {firstName: '', lastName: '', email: '', phone: '', address: '', password: '', confirm: ''},
  })

  useEffect(() => {
    if (!loading && user) router.replace('/' + locale + '/dashboard')
  }, [user, loading, router, locale])

  async function onSubmit(data: FormValues) {
    try {
      const {user: newUser} = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await setDoc(doc(db, 'users', newUser.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: 'parent',
        createdAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'parents', newUser.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdAt: serverTimestamp(),
      })
      await sendEmailVerification(newUser)
      router.replace('/' + locale + '/verify-email')
    } catch (err) {
      const code = err instanceof Object && 'code' in err ? err.code : undefined
      setError('root', {message: code === 'auth/email-already-in-use' ? t('errorEmailInUse') : t('errorGeneric')})
    }
  }

  if (loading) return null

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Logo" width={72} height={72} className="mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-navy">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField label={t('firstName') + ' *'} placeholder="Jan" error={errors.firstName?.message} {...register('firstName')} />
            <TextField label={t('lastName') + ' *'} placeholder="Kowalski" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <TextField type="email" label={t('email') + ' *'} placeholder="jan@email.com" error={errors.email?.message} {...register('email')} />
          <TextField type="tel" label={t('phone') + ' *'} placeholder="+1 (732) 000-0000" error={errors.phone?.message} {...register('phone')} />
          <TextField label={t('address')} placeholder={t('addressPlaceholder')} error={errors.address?.message} {...register('address')} />
          <TextField type="password" label={t('password') + ' *'} placeholder={t('passwordPlaceholder')} error={errors.password?.message} {...register('password')} />
          <TextField type="password" label={t('confirm') + ' *'} placeholder="••••••••" error={errors.confirm?.message} {...register('confirm')} />

          <FormError message={errors.root?.message} />

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-navy text-white font-bold py-2.5 rounded hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm mt-2">
            {isSubmitting ? t('submitting') : t('submitBtn')}
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
