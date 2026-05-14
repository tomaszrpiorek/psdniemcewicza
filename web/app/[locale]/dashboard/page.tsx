'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useLocale} from 'next-intl'
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, serverTimestamp,
} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {useAuth} from '@/contexts/AuthContext'

type Grade = {id: string; name: string; level: number}
type Child = {id: string; firstName: string; lastName: string; gradeId: string}
type ParentProfile = {firstName: string; lastName: string; email: string; phone: string; address: string}

export default function DashboardPage() {
  const {user, loading, signOut} = useAuth()
  const router = useRouter()
  const locale = useLocale()

  const [profile, setProfile]   = useState<ParentProfile | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [grades, setGrades]     = useState<Grade[]>([])
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [showAdd, setShowAdd]   = useState(false)

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/' + locale + '/login')
  }, [user, loading, router, locale])

  // Load parent profile
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'parents', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as ParentProfile)
    })
  }, [user])

  // Load grades for selector
  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'grades'), orderBy('level'))).then(snap => {
      setGrades(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Grade, 'id'>)})))
    })
  }, [user])

  // Real-time children list
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'children'), where('parentId', '==', user.uid))
    return onSnapshot(q, snap => {
      setChildren(snap.docs.map(d => ({id: d.id, ...(d.data() as Omit<Child, 'id'>)})))
    })
  }, [user])

  async function handleDelete(childId: string, name: string) {
    if (!confirm(`Usunąć ${name} z listy dzieci?`)) return
    await deleteDoc(doc(db, 'children', childId))
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/' + locale + '/login')
  }

  function gradeName(gradeId: string) {
    return grades.find(g => g.id === gradeId)?.name ?? '—'
  }

  if (loading || !user) return null

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Witaj, {profile?.firstName ?? ''}!
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm border border-gray-200 text-gray-500 px-4 py-1.5 rounded hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Wyloguj
        </button>
      </div>

      {/* Profile card */}
      {profile && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">Mój profil</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Imię i nazwisko</span><p className="font-medium text-navy">{profile.firstName} {profile.lastName}</p></div>
            <div><span className="text-gray-400">Telefon</span><p className="font-medium text-navy">{profile.phone || '—'}</p></div>
            <div><span className="text-gray-400">Email</span><p className="font-medium text-navy">{profile.email}</p></div>
            <div><span className="text-gray-400">Adres</span><p className="font-medium text-navy">{profile.address || '—'}</p></div>
          </div>
        </div>
      )}

      {/* Children section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">
            Moje dzieci
            <span className="ml-2 text-sm font-normal text-gray-400">({children.length})</span>
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gold text-navy text-sm font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors"
          >
            + Dodaj dziecko
          </button>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            Nie dodałeś jeszcze żadnych dzieci.<br />
            Kliknij &quot;Dodaj dziecko&quot; aby zacząć.
          </div>
        ) : (
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy">{child.firstName} {child.lastName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{gradeName(child.gradeId)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingChild(child)}
                    className="text-sm text-gold font-semibold hover:underline"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(child.id, child.firstName)}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <ChildModal
          parentId={user.uid}
          grades={grades}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editingChild && (
        <ChildModal
          parentId={user.uid}
          grades={grades}
          existing={editingChild}
          onClose={() => setEditingChild(null)}
        />
      )}
    </main>
  )
}

function ChildModal({parentId, grades, existing, onClose}: {
  parentId: string
  grades: Grade[]
  existing?: Child
  onClose: () => void
}) {
  const [firstName, setFirstName] = useState(existing?.firstName ?? '')
  const [lastName, setLastName]   = useState(existing?.lastName ?? '')
  const [gradeId, setGradeId]     = useState(existing?.gradeId ?? grades[0]?.id ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const isEdit = !!existing

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !gradeId) {
      setError('Wypełnij wszystkie pola.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'children', existing!.id), {
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          gradeId,
        })
      } else {
        await addDoc(collection(db, 'children'), {
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          gradeId,
          parentId,
          createdAt: serverTimestamp(),
        })
      }
      onClose()
    } catch {
      setError('Błąd zapisu. Spróbuj ponownie.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-navy">{isEdit ? 'Edytuj dziecko' : 'Dodaj dziecko'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Imię *</label>
              <input
                value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="Maria"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nazwisko *</label>
              <input
                value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold"
                placeholder="Kowalska"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Klasa *</label>
            <select
              value={gradeId} onChange={e => setGradeId(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gold bg-white"
            >
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
              Anuluj
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-navy text-white font-bold py-2 rounded text-sm hover:bg-navy-dark transition-colors disabled:opacity-60">
              {saving ? 'Zapisywanie…' : isEdit ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
