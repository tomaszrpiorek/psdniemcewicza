'use client'

import {useEffect, useState} from 'react'
import {IconCheckCircle} from '@/components/icons'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {httpsCallable} from 'firebase/functions'
import {FirebaseError} from 'firebase/app'
import {functions} from '@/lib/firebase'
import {ensureAppCheck} from '@/lib/appCheck'
import {useTranslations} from 'next-intl'
import {zodResolver} from '@/lib/zodResolver'
import {requiredEmail, requiredName, requiredString} from '@/lib/validation'
import TextField from '@/components/form/TextField'
import TextAreaField from '@/components/form/TextAreaField'
import FormError from '@/components/form/FormError'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'limited'

export default function ContactForm() {
  const t = useTranslations('Contact')
  const v = useTranslations('Validation')
  const [status, setStatus] = useState<Status>('idle')
  // Spam check: a field people never see, which only bots fill in.
  const [website, setWebsite] = useState('')

  useEffect(() => { ensureAppCheck().catch(() => {}) }, [])

  const schema = z.object({
    name: requiredName(v('required'), v('invalidName')),
    email: requiredEmail(v('required'), v('invalidEmail')),
    message: requiredString(v('required')).max(5000, v('messageTooLong')),
  })
  type FormValues = z.infer<typeof schema>

  const {
    register, handleSubmit, reset,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: {name: '', email: '', message: ''}})

  async function onSubmit(data: FormValues, event?: React.BaseSyntheticEvent) {
    setStatus('sending')
    try {
      await ensureAppCheck()
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail')
      // timeStamp is the time since the page was opened; a submit within the first seconds is a bot.
      await sendContactEmail({...data, website, elapsedMs: event?.timeStamp})
      setStatus('sent')
      reset()
    } catch (err) {
      const limited = err instanceof FirebaseError && err.code === 'functions/resource-exhausted'
      setStatus(limited ? 'limited' : 'error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-8">
        <IconCheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
        <p className="text-navy font-bold">{t('sendSuccess')}</p>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Website
          <input
            type="text" name="website" tabIndex={-1} autoComplete="off"
            value={website} onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
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
      {status === 'limited' && <FormError message={t('sendLimited')} />}
      <button
        type="submit" disabled={isSubmitting || status === 'sending'}
        className="w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('sendBtn')}
      </button>
    </form>
  )
}
