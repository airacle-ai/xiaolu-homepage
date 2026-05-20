import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserRecord } from '../lib/supabase'

interface UserContextType {
  user: UserRecord | null
  setUser: (user: UserRecord | null) => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null)

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
