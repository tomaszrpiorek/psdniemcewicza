import {client, urlFor} from '@/lib/sanity'
import Image from 'next/image'

export const revalidate = 30

async function getStaff() {
  return client.fetch(`*[_type == "staffMember"] | order(order asc) {
    _id, name, role, photo, bio, email
  }`)
}

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Szkoła</p>
          <h1 className="text-3xl font-bold">Kadra Pedagogiczna</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {staff.length === 0 && <p className="text-gray-400 text-sm">Brak danych o kadrze.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member: any) => (
            <div key={member._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-gold transition-colors">
              <div className="relative h-52 bg-gray-100">
                {member.photo ? (
                  <Image
                    src={urlFor(member.photo).width(400).height(300).fit('crop').url()}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300 bg-cream">👤</div>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-bold text-navy text-lg">{member.name}</h2>
                {member.role && <p className="text-sm text-gold font-semibold mt-0.5">{member.role}</p>}
                {member.bio && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{member.bio}</p>}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="inline-block mt-3 text-xs text-navy hover:text-gold underline transition-colors">
                    {member.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
