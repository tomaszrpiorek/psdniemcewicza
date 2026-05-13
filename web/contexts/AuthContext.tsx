'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import {onAuthStateChanged, signOut as fbSignOut, User} from 'firebase/auth'
import {doc, getDoc} from 'firebase/firestore'
import {auth, db} from '@/lib/firebase'

export type UserRole = 'teacher' | 'parent' | null

type AuthContextType = {
  user: User | null
  role: UserRole
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser]       = useState<User | null>(null)
  const [role, setRole]       = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setRole(snap.exists() ? (snap.data().role as UserRole) : null)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{user, role, loading, signOut: () => fbSignOut(auth)}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
