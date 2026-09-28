'use client'

import {useState} from 'react'

type Ev = {date: string; title: string}

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function MonthCalendar({
  events,
  noClassDates,
  schoolYearStart,
  schoolYearEnd,
  locale,
  labels,
}: {
  events: Ev[]
  noClassDates: string[]
  schoolYearStart: string
  schoolYearEnd: string
  locale: string
  labels: {
    legendClass: string
    legendNoClass: string
    legendEvent: string
    prevMonth: string
    nextMonth: string
    noEventsForDay: string
  }
}) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  const eventsByDate = new Map<string, string[]>()
  for (const e of events) {
    const key = e.date.slice(0, 10)
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(e.title)
  }
  const noClassSet = new Set(noClassDates)

  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthLabel = cursor.toLocaleDateString(locale, {month: 'long', year: 'numeric'})
  const weekdayLabels = Array.from({length: 7}, (_, i) =>
    new Date(2024, 0, 7 + i).toLocaleDateString(locale, {weekday: 'short'})
  )

  const selectedEvents = selected ? eventsByDate.get(selected) : undefined

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelected(null) }}
          aria-label={labels.prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-navy text-lg"
        >
          ‹
        </button>
        <p className="font-bold text-navy capitalize">{monthLabel}</p>
        <button
          onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelected(null) }}
          aria-label={labels.nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-navy text-lg"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 uppercase mb-1">
        {weekdayLabels.map((w, i) => <div key={i}>{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const key = toKey(year, month, d)
          const dayEvents = eventsByDate.get(key)
          const isNoClass = noClassSet.has(key)
          const isMonday = new Date(year, month, d).getDay() === 1
          const inSchoolYear = key >= schoolYearStart && key <= schoolYearEnd
          const isToday = key === todayKey
          const isSelected = key === selected

          let dot: string | null = null
          if (dayEvents) dot = 'bg-blue-500'
          else if (isNoClass) dot = 'bg-red-500'
          else if (isMonday && inSchoolYear) dot = 'bg-green-500'

          return (
            <button
              key={i}
              onClick={() => setSelected(isSelected ? null : key)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors
                ${isSelected ? 'bg-navy text-white' : isToday ? 'ring-2 ring-gold text-navy' : dayEvents ? 'text-navy font-bold hover:bg-cream' : 'text-gray-600 hover:bg-cream'}`}
            >
              {d}
              {dot && (
                <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dot}`} />
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
          {selectedEvents ? (
            <ul className="space-y-1">
              {selectedEvents.map((title, i) => (
                <li key={i} className="text-navy font-semibold">• {title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">{labels.noEventsForDay}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{labels.legendClass}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />{labels.legendNoClass}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />{labels.legendEvent}</span>
      </div>
    </div>
  )
}
