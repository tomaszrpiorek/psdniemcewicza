import {client} from '@/lib/sanity'

export const revalidate = 30

async function getEvents() {
  return client.fetch(`*[_type == "event"] | order(date asc) { _id, title, date, location, description }`)
}

export default async function CalendarPage() {
  const events = await getEvents()

  const upcoming = events.filter((e: any) => new Date(e.date) >= new Date())
  const past = events.filter((e: any) => new Date(e.date) < new Date())

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Szkoła</p>
          <h1 className="text-3xl font-bold">Kalendarz Wydarzeń</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">Nadchodzące wydarzenia</h2>
          {upcoming.length === 0 && <p className="text-gray-400 text-sm">Brak nadchodzących wydarzeń.</p>}
          <div className="space-y-3">
            {upcoming.map((e: any) => {
              const d = new Date(e.date)
              return (
                <div key={e._id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-hidden">
                  <div className="bg-navy text-white text-center px-4 py-4 min-w-[64px] flex flex-col justify-center shrink-0">
                    <p className="text-gold text-xs font-bold uppercase">{d.toLocaleDateString('pl-PL', {month: 'short'})}</p>
                    <p className="text-3xl font-bold leading-none">{d.getDate()}</p>
                    <p className="text-gray-400 text-xs">{d.getFullYear()}</p>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-navy">{e.title}</h3>
                    {e.location && <p className="text-xs text-gray-500 mt-1">📍 {e.location}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {d.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-navy border-b-2 border-gray-200 pb-1 mb-5 text-gray-400">Minione wydarzenia</h2>
            <div className="space-y-2 opacity-60">
              {past.reverse().map((e: any) => {
                const d = new Date(e.date)
                return (
                  <div key={e._id} className="flex items-center gap-4 bg-white rounded border border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-400 shrink-0 w-24">
                      {d.toLocaleDateString('pl-PL', {day: 'numeric', month: 'short'})}
                    </p>
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
