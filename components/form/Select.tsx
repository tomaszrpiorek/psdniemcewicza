'use client'

import {useEffect, useId, useRef, useState} from 'react'

type ListPos = {left: number; width: number; top?: number; bottom?: number; maxHeight: number}

const LIST_MAX = 240 // px, same as max-h-60
const GAP = 4

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
  const [pos, setPos] = useState<ListPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
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

  // The list is position: fixed so a scrolling parent (e.g. a modal with
  // overflow-y-auto) can't clip it. It opens upwards when there's more room
  // above, and closes if anything other than the list itself scrolls.
  function place() {
    const r = buttonRef.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom - GAP * 2
    const above = r.top - GAP * 2
    if (below >= Math.min(LIST_MAX, 160) || below >= above) {
      setPos({left: r.left, width: r.width, top: r.bottom + GAP, maxHeight: Math.min(LIST_MAX, below)})
    } else {
      setPos({left: r.left, width: r.width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(LIST_MAX, above)})
    }
  }

  useEffect(() => {
    if (!open) return
    function onScroll(e: Event) {
      if (listRef.current && listRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({block: 'nearest'})
  }, [open, activeIndex, pos])

  function openList() {
    if (disabled) return
    place()
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
          ref={buttonRef}
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

        {open && pos && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={{left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight}}
            className="fixed z-[60] overflow-auto overscroll-contain bg-white border border-gray-100 rounded-lg shadow-lg py-1"
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); commit(i) }}
                className={`px-3 py-3 sm:py-2 text-sm cursor-pointer flex items-center justify-between ${
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
