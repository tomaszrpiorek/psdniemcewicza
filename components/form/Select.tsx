'use client'

import {useEffect, useId, useRef, useState} from 'react'

export type SelectOption = {value: string; label: string}

type Props = {
  label?: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

// Custom-styled listbox to replace the native <select> (which can't be
// themed once open) while staying keyboard- and screen-reader-accessible.
export default function Select({
  label, required, error, value, onChange, onBlur, options, placeholder = '—', disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [open, onBlur])

  function openList() {
    if (disabled) return
    setOpen(true)
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)))
  }

  function commit(index: number) {
    const opt = options[index]
    if (opt) onChange(opt.value)
    setOpen(false)
    onBlur?.()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openList()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(activeIndex)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef}>
      {label && (
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-gold ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          role="combobox"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={!!error}
          className={`w-full flex items-center justify-between gap-2 border rounded px-3 py-2.5 text-sm text-left bg-white transition-colors focus:outline-none ${
            error ? 'border-red-300' : open ? 'border-gold' : 'border-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={selected ? 'text-navy' : 'text-gray-400'}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-gold shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-100 rounded-lg shadow-lg py-1"
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); commit(i) }}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                  i === activeIndex ? 'bg-cream' : ''
                } ${opt.value === value ? 'font-semibold text-navy' : 'text-gray-600'}`}
              >
                {opt.label}
                {opt.value === value && <span className="text-gold">✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
