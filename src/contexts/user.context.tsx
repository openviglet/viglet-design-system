import type { VigUser } from "@/models/user"
import React from "react"

interface UserContextValue {
  user: VigUser
  refreshUser: () => void
}

const UserContext = React.createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: React.ReactNode
  fetchUser: () => Promise<VigUser>
}

export function UserProvider({ children, fetchUser }: UserProviderProps) {
  const [user, setUser] = React.useState<VigUser>({} as VigUser)

  const refreshUser = React.useCallback(() => {
    fetchUser().then(setUser)
  }, [fetchUser])

  React.useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value = React.useMemo(() => ({ user, refreshUser }), [user, refreshUser])

  return <UserContext value={value}>{children}</UserContext>
}

export function useCurrentUser(): UserContextValue {
  const ctx = React.useContext(UserContext)
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider")
  return ctx
}
