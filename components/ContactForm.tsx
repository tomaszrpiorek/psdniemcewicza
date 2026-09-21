'use client'

import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {httpsCallable} from 'firebase/functions'
import {functions} from '@/lib/firebase'
import {useTranslations} from 'next-intl'
import {zodResolver} from '@/lib/zodResolver'
import {requiredEmail, requiredName, requiredString} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import TextAreaField from '@/components/form/TextAreaField'
import FormError from '@/components/form/FormError'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const t = useTranslations('Contact')
  const v = useTranslations('Validation')
  const [status, setStatus] = useState<Status>('idle')

  const schema = z.object({
    name: requiredName(v('required'), v('invalidName')),
    email: requiredEmail(v('required'), v('invalidEmail')),
    message: requiredString(v('required')),
  })
  type FormValues = z.infer<typeof schema>

  const {
    register, handleSubmit, reset,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: {name: '', email: '', message: ''}})

  async function onSubmit(data: FormValues) {
    setStatus('sending')
    try {
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail')
      await sendContactEmail(data)
      setStatus('sent')
      reset()
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
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label={t('nameLabel')} placeholder={t('namePlaceholder')}
        error={errors.name?.message} {...register('name')}
      />
      <TextField
        type="email" label={t('emailFormLabel')} placeholder="email@example.com"
        error={errors.email?.message} {...register('email')}
      />
      <TextAreaField
        label={t('messageLabel')} rows={5} placeholder={t('messagePlaceholder')}
        error={errors.message?.message} {...register('message')}
      />
      {status === 'error' && <FormError message={t('sendError')} />}
      <button
        type="submit" disabled={isSubmitting || status === 'sending'}
        className="w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('sendBtn')}
      </button>
    </form>
  )
}
