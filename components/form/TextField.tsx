'use client'

import {forwardRef} from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  required?: boolean
}

const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  {label, error, required, className, ...rest},
  ref
) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-gold ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        aria-invalid={!!error}
        className={`w-full border rounded px-3 py-2.5 text-sm focus:outline-none transition-colors ${
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gold'
        } ${className ?? ''}`}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
})

export default TextField
