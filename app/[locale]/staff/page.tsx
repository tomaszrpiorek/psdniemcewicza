import {client, getFeaturedPhoto} from '@/lib/sanity'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'
import type {Metadata} from 'next'
import {pageMetadata} from '@/lib/seo'

export const revalidate = 30

async function getStaff() {
  return client.fetch(`*[_type == "staffMember"] | order(order asc) { _id, name, role }`)
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Staff'})
  const m = await getTranslations({locale, namespace: 'Metadata'})
  return pageMetadata(locale, '/staff', t('title'), m('staffDescription'))
}

export default async function StaffPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Staff'})
  const [staff, heroPhoto] = await Promise.all([getStaff(), getFeaturedPhoto(2)])

  return (
    <main>
      <div className="relative overflow-hidden py-12 px-4">
        {heroPhoto && <Image src={heroPhoto} alt="" fill className="object-cover" />}
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-5xl mx-auto text-white">
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {staff.length === 0 && <p className="text-gray-400 text-sm">{t('empty')}</p>}
        {staff.length > 0 && (
          <div className="max-w-3xl overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('colName')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('colRole')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((member: any) => (
                  <tr key={member._id} className="even:bg-cream/50">
                    <td className="px-4 py-3 font-bold text-navy align-top">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600 align-top">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
