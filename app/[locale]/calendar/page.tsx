import {client} from '@/lib/sanity'
import {getTranslations} from 'next-intl/server'

export const revalidate = 30

// Google Calendar embed — disabled while the calendar isn't actively kept in sync.
// Sanity's `event` list below is the source of truth. Re-enable by restoring the
// iframe block if the school starts maintaining this Google Calendar again.
// const GOOGLE_CALENDAR_SRC = 'https://calendar.google.com/calendar/embed?src=psdniemcewicza%40gmail.com&ctz=America%2FNew_York'

async function getEvents() {
  return client.fetch(`*[_type == "event"] | order(date asc) { _id, title, date, location }`)
}

export default async function CalendarPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Calendar'})
  const events = await getEvents()
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  const upcoming = events.filter((e: any) => new Date(e.date) >= new Date())
  const past     = events.filter((e: any) => new Date(e.date) <  new Date()).reverse()

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-gray-300 text-sm italic">{t('motto')}</p>
        </div>
      </div>

      {/* Class schedule at a glance */}
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <div className="rounded-xl border border-gray-100 shadow-sm bg-white p-6 grid sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold mb-2">{t('scheduleTitle')}</h2>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="font-bold text-navy text-sm">{t('regularLabel')}</p>
                <p className="text-gray-500 text-sm">{t('regularDesc')}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <p className="font-bold text-navy text-sm">{t('noClassLabel')}</p>
            </div>
            <ul className="text-gray-500 text-sm space-y-1 pl-6 list-disc">
              <li>{t('noClass1')}</li>
              <li>{t('noClass2')}</li>
              <li>{t('noClass3')}</li>
              <li>{t('noClass4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upcoming events list from Sanity */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <section>
          <h2 className="text-xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">{t('upcoming')}</h2>
          {upcoming.length === 0 && <p className="text-gray-400 text-sm">{t('noUpcoming')}</p>}
          <div className="space-y-3">
            {upcoming.map((e: any) => {
              const d = new Date(e.date)
              return (
                <div key={e._id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-hidden">
                  <div className="bg-navy text-white text-center px-4 py-4 min-w-[64px] flex flex-col justify-center shrink-0">
                    <p className="text-gold text-xs font-bold uppercase">{d.toLocaleDateString(dateLocale, {month: 'short'})}</p>
                    <p className="text-3xl font-bold leading-none">{d.getDate()}</p>
                    <p className="text-gray-400 text-xs">{d.getFullYear()}</p>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-navy">{e.title}</h3>
                    {e.location && <p className="text-xs text-gray-500 mt-1">📍 {e.location}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-400 border-b-2 border-gray-200 pb-1 mb-5">{t('past')}</h2>
            <div className="space-y-2 opacity-60">
              {past.map((e: any) => {
                const d = new Date(e.date)
                return (
                  <div key={e._id} className="flex items-center gap-4 bg-white rounded border border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-400 shrink-0 w-24">{d.toLocaleDateString(dateLocale, {day: 'numeric', month: 'short'})}</p>
                    <p className="text-sm font-medium text-gray-600">{e.title}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
