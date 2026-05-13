'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import {
  collection, query, where, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'

const CLASSES = [
  {id: 'przedszkole', label: 'Przedszkole'},
  {id: 'klasa-1',     label: 'Klasa 1'},
  {id: 'klasa-2',     label: 'Klasa 2'},
  {id: 'klasa-3',     label: 'Klasa 3'},
  {id: 'klasa-4',     label: 'Klasa 4'},
  {id: 'klasa-5',     label: 'Klasa 5'},
]

type Parent = {
  id: string
  name: string
  email: string
  phone: string
  childName: string
  classId: string
}

export default function AdminPage() {
  const {user, role, loading, signOut} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const [activeClass, setActiveClass]   = useState('przedszkole')
  const [parents, setParents]           = useState<Parent[]>([])
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [showModal, setShowModal]       = useState(false)
  const [deleting, setDeleting]         = useState<string | null>(null)

  // Redirect if not a teacher
  useEffect(() => {
    if (!loading && (!user || role !== 'teacher')) {
      router.replace('/' + locale + '/login')
    }
  }, [user, role, loading, router, locale])

  // Real-time parent list for active class
  useEffect(() => {
    if (!user || role !== 'teacher') return
    const q = query(collection(db, 'parents'), where('classId', '==', activeClass))
    const unsub = onSnapshot(q, (snap) => {
      setParents(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Parent, 'id'>)})))
      setSelected(new Set())
    })
    return unsub
  }, [activeClass, user, role])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === parents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parents.map(p => p.id)))
    }
  }

  async function handleDelete(parentId: string) {
    if (!confirm('Usunąć tego rodzica?')) return
    setDeleting(parentId)
    await deleteDoc(doc(db, 'parents', parentId))
    setDeleting(null)
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/' + locale + '/login')
  }

  if (loading || !user || role !== 'teacher') return null

  const activeLabel = CLASSES.find(c => c.id === activeClass)?.label

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Panel nauczyciela</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Wyloguj
        </button>
      </div>

      {/* Class tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CLASSES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveClass(c.id)}
            className={`px-4 py-2 rounded text-sm font-semibold border transition-colors ${
              c.id === activeClass
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-navy border-gray-200 hover:border-gold hover:text-gold'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy border-b-2 border-gold pb-1">
          {activeLabel}
          <span className="ml-2 text-sm font-normal text-gray-400">({parents.length})</span>
        </h2>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <span className="text-xs bg-gold/10 text-gold border border-gold/30 px-3 py-1.5 rounded font-semibold">
              {selected.size} zaznaczone
            </span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="bg-gold text-navy text-sm font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors"
          >
            + Dodaj rodzica
          </button>
        </div>
      </div>

      {/* Parent table */}
      {parents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Brak rodziców w tej klasie. Kliknij &quot;Dodaj rodzica&quot; aby dodać.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === parents.length && parents.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-navy"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rodzic</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dziecko</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parents.map(p => (
                <tr
                  key={p.id}
                  className={`transition-colors ${selected.has(p.id) ? 'bg-gold/5' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="accent-navy"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.childName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddParentModal
          classId={activeClass}
          classLabel={activeLabel!}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  )
}

function AddParentModal({classId, classLabel, onClose}: {classId: string; classLabel: string; onClose: () => void}) {
  const [name, setName]           = useState('')
  const [childName, setChildName] = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError('Imię i nazwisko oraz telefon są wymagane.')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'parents'), {
        name:      name.trim(),
        childName: childName.trim(),
        phone:     phone.trim(),
        email:     email.trim(),
        classId,
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch {
      setError('Błąd zapisu. Spróbuj ponownie.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-navy">Dodaj rodzica — {classLabel}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Imię i nazwisko rodzica *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="Jan Kowalski"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Imię dziecka</label>
            <input
              value={childName} onChange={e => setChildName(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="Maria"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Telefon *</label>
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="+1 (732) 000-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
              placeholder="rodzic@email.com"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
              Anuluj
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-navy text-white font-bold py-2 rounded text-sm hover:bg-navy-dark transition-colors disabled:opacity-60">
              {saving ? 'Zapisywanie…' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
