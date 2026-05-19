'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import {onAuthStateChanged, signOut as fbSignOut, User} from 'firebase/auth'
import {doc, getDoc} from 'firebase/firestore'
import {auth, db} from '@/lib/firebase'

export type UserRole = 'teacher' | 'parent' | null

type AuthContextType = {
  user: User | null
  role: UserRole
  superAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  superAdmin: false,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser]           = useState<User | null>(null)
  const [role, setRole]           = useState<UserRole>(null)
  const [superAdmin, setSuperAdmin] = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setRole(data.role as UserRole)
          setSuperAdmin(data.superAdmin === true)
        } else {
          setRole(null)
          setSuperAdmin(false)
        }
      } else {
        setUser(null)
        setRole(null)
        setSuperAdmin(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{user, role, superAdmin, loading, signOut: () => fbSignOut(auth)}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
