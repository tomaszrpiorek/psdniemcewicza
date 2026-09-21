'use client'

import {forwardRef} from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({label, error, className, ...rest}, ref) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input ref={ref} type="checkbox" className={`accent-navy mt-0.5 shrink-0 ${className ?? ''}`} {...rest} />
        <span className="text-sm text-gray-600">{label}</span>
      </label>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
})

export default Checkbox
