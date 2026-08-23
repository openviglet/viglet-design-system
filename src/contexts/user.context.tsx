import type { VigUser } from "@/models/user"
import React from "react"

/**
 * Where the current user has got to.
 *
 * `user` alone could not say. It is initialised to `{} as VigUser`, so a
 * consumer reading `user.name` gets `undefined` whether the request is in
 * flight, the session expired, or the account genuinely has no name — three
 * different screens, one indistinguishable value. Every consumer invented its
 * own guess at which it was looking at; `BentoUserMenu` guessed "loading" from
 * an absent username, and so rendered a skeleton for ever when the fetch failed.
 */
export type VigUserStatus = "loading" | "ready" | "failed"

/**
 * "loading" is the state before the first result, not "a request is in flight" —
 * see `refreshUser`.
 */

interface UserContextValue {
  user: VigUser
  refreshUser: () => void
  /** Which of the three states `user` is in. */
  status: VigUserStatus
  /** What `fetchUser` rejected with, while `status` is "failed". */
  error: unknown
}

const UserContext = React.createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: React.ReactNode
  /**
   * Loads the current user. Rejecting puts the provider in `status: "failed"`
   * with `error` set; the rejection is not rethrown, so a caller does not have
   * to guard against it becoming an unhandled rejection.
   */
  fetchUser: () => Promise<VigUser>
}

export function UserProvider({ children, fetchUser }: UserProviderProps) {
  const [user, setUser] = React.useState<VigUser>({} as VigUser)
  const [status, setStatus] = React.useState<VigUserStatus>("loading")
  const [error, setError] = React.useState<unknown>(null)

  // Which request is the current one. `refreshUser` is public and can be called
  // again before the last settles; without this the slower of the two wins and
  // writes its user over the newer one.
  const latest = React.useRef(0)

  const refreshUser = React.useCallback(() => {
    const request = ++latest.current

    // `status` deliberately keeps its last settled value while a refresh is in
    // flight, rather than dropping back to "loading". Two reasons: the mount
    // effect calls this, and a synchronous setState there is the cascading
    // render `set-state-in-effect` names; and a background refresh that flipped
    // the status would blank the avatar `BentoUserMenu` is already showing.
    // "loading" therefore means "has never settled", which is the only state a
    // consumer cannot work out for itself.

    // `.then(setUser)` stood here with no catch, so a rejecting fetchUser — an
    // expired session, an unreachable API — left the app as an
    // unhandledrejection and the user as an empty object nobody could read a
    // state off. Both halves are handled here now.
    fetchUser().then(
      (next) => {
        if (request !== latest.current) return
        setUser(next)
        setError(null)
        setStatus("ready")
      },
      (reason: unknown) => {
        if (request !== latest.current) return
        setError(reason)
        setStatus("failed")
      },
    )
  }, [fetchUser])

  React.useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value = React.useMemo(
    () => ({ user, refreshUser, status, error }),
    [user, refreshUser, status, error],
  )

  return <UserContext value={value}>{children}</UserContext>
}

export function useCurrentUser(): UserContextValue {
  const ctx = React.useContext(UserContext)
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider")
  return ctx
}
