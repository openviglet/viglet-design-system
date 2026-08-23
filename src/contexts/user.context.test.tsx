import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { VigUser } from "@/models/user"

import { UserProvider, useCurrentUser } from "./user.context"

// VDS60 — the provider used to be `fetchUser().then(setUser)`. A rejection had
// no catch and left the app as an unhandledrejection; `user` was
// `{} as VigUser`, so nothing downstream could tell a pending request from an
// expired session from an account with no name. Both halves are held here.

const alice = { username: "alice", firstName: "Alice" } as VigUser

function Probe() {
  const { user, status, error } = useCurrentUser()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user.username ?? "none"}</span>
      <span data-testid="error">{error ? String(error) : "none"}</span>
    </div>
  )
}

function draw(fetchUser: () => Promise<VigUser>) {
  return render(
    <UserProvider fetchUser={fetchUser}>
      <Probe />
    </UserProvider>,
  )
}

/** Collects rejections that escape into the runner, where they actually land. */
async function withRejectionWatch(body: () => Promise<void>): Promise<unknown[]> {
  const seen: unknown[] = []
  const record = (reason: unknown) => seen.push(reason)
  process.on("unhandledRejection", record)
  try {
    await body()
    await new Promise((resolve) => setTimeout(resolve, 0))
  } finally {
    process.off("unhandledRejection", record)
  }
  return seen
}

describe("UserProvider", () => {
  it("reports loading before the first user lands", () => {
    draw(() => new Promise<VigUser>(() => {}))

    expect(screen.getByTestId("status")).toHaveTextContent("loading")
  })

  it("reports ready with the user once it resolves", async () => {
    draw(vi.fn().mockResolvedValue(alice))

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"))
    expect(screen.getByTestId("user")).toHaveTextContent("alice")
    expect(screen.getByTestId("error")).toHaveTextContent("none")
  })

  it("reports failed, keeps the reason, and lets nothing escape the run", async () => {
    const escaped = await withRejectionWatch(async () => {
      draw(vi.fn().mockRejectedValue(new Error("401")))
      await waitFor(() =>
        expect(screen.getByTestId("status")).toHaveTextContent("failed"),
      )
    })

    expect(screen.getByTestId("error")).toHaveTextContent("401")
    expect(escaped).toEqual([])
  })

  it("distinguishes a failure from a user who simply has no username", async () => {
    draw(vi.fn().mockResolvedValue({} as VigUser))

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"))
    // Same empty `user` as the failure case — only `status` separates them, and
    // that is the whole point.
    expect(screen.getByTestId("user")).toHaveTextContent("none")
  })

  it("ignores a slower refresh that settles after a newer one", async () => {
    let releaseFirst: (u: VigUser) => void = () => {}
    const fetchUser = vi
      .fn<() => Promise<VigUser>>()
      .mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = resolve }))
      .mockResolvedValue(alice)

    function Refresher() {
      const { refreshUser, user } = useCurrentUser()
      return (
        <button type="button" onClick={refreshUser}>
          {user.username ?? "none"}
        </button>
      )
    }

    render(
      <UserProvider fetchUser={fetchUser}>
        <Refresher />
      </UserProvider>,
    )

    // Second request starts and wins while the first is still outstanding.
    screen.getByRole("button").click()
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("alice"))

    releaseFirst({ username: "stale" } as VigUser)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getByRole("button")).toHaveTextContent("alice")
  })

  it("throws outside a provider, so a missing one is not a silent empty user", () => {
    expect(() => render(<Probe />)).toThrow(/within UserProvider/)
  })
})
