'use client'

import type {FieldValues, Path, UseFormRegister} from 'react-hook-form'

type Props<T extends FieldValues> = {
  label: string
  required?: boolean
  error?: string
  name: Path<T>
  register: UseFormRegister<T>
  yesLabel: string
  noLabel: string
}

export default function RadioPills<T extends FieldValues>({
  label, required, error, name, register, yesLabel, noLabel,
}: Props<T>) {
  return (
    <div>
      <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </p>
      <div className="flex gap-6 sm:gap-4">
        {[{val: 'yes', text: yesLabel}, {val: 'no', text: noLabel}].map(({val, text}) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer py-1.5 sm:py-0">
            <input type="radio" value={val} className="accent-navy w-5 h-5 sm:w-4 sm:h-4" {...register(name)} />
            <span className="text-sm text-navy">{text}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
