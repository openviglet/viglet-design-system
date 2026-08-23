import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// VDS63 — src/lib/axios.ts had no tests, and it carries CSRF for three products,
// a 403 retry and a 401 redirect that navigates the window. The defect that
// brought it here: `ensureCsrfToken` checks the token and then awaits, so every
// mutating request that started while the first was out fetched its own.

type RequestHandler = (config: Config) => Promise<Config> | Config
type ResponseErrorHandler = (error: unknown) => Promise<unknown>

interface Config {
  url?: string
  method?: string
  baseURL?: string
  headers?: Record<string, string>
  _csrfRetried?: boolean
}

const captured: {
  request?: RequestHandler
  responseError?: ResponseErrorHandler
} = {}

const csrfGet = vi.fn()
const axiosRequest = vi.fn()

vi.mock("axios", () => {
  const instance = {
    defaults: {} as Record<string, unknown>,
    get: (...args: unknown[]) => csrfGet(...args),
  }
  const main = {
    defaults: {} as Record<string, unknown>,
    create: () => instance,
    interceptors: {
      request: {
        use: (handler: RequestHandler) => {
          captured.request = handler
        },
      },
      response: {
        use: (_ok: unknown, err: ResponseErrorHandler) => {
          captured.responseError = err
        },
      },
    },
    request: (...args: unknown[]) => axiosRequest(...args),
  }
  return { default: main, ...main }
})

/** A token response the module will accept, by header. */
const tokenResponse = (token: string) => ({
  headers: { "x-xsrf-token": token },
  data: {},
})

let setupAxiosInterceptors: (o?: {
  baseURL?: string
  loginPath?: string
}) => void

beforeEach(async () => {
  vi.resetModules()
  csrfGet.mockReset()
  axiosRequest.mockReset()
  captured.request = undefined
  captured.responseError = undefined
  document.cookie = ""
  ;({ setupAxiosInterceptors } = await import("./axios"))
  setupAxiosInterceptors({ baseURL: "https://api.test" })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const post = (over: Partial<Config> = {}): Config => ({
  url: "/things",
  method: "post",
  headers: {},
  ...over,
})

describe("the CSRF request interceptor", () => {
  it("fetches one token for concurrent mutating requests, not one each", async () => {
    const releases: Array<(v: unknown) => void> = []
    csrfGet.mockImplementation(
      () => new Promise((resolve) => { releases.push(resolve) }),
    )

    const handler = captured.request
    if (!handler) throw new Error("no request interceptor")

    const inFlight = [handler(post()), handler(post()), handler(post())]
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Three racing POSTs used to make three /csrf calls; a server that rotates
    // its token on issue then leaves two of them holding a replaced one.
    expect(csrfGet).toHaveBeenCalledTimes(1)

    for (const release of releases) release(tokenResponse("tok-1"))
    const configs = (await Promise.all(inFlight)) as Config[]

    for (const config of configs) {
      expect(config.headers?.["X-XSRF-TOKEN"]).toBe("tok-1")
    }
  })

  it("reuses the token it already holds, without asking again", async () => {
    csrfGet.mockResolvedValue(tokenResponse("tok-1"))
    const handler = captured.request
    if (!handler) throw new Error("no request interceptor")

    await handler(post())
    await handler(post())

    expect(csrfGet).toHaveBeenCalledTimes(1)
  })

  it("lets a later request retry after a fetch that failed", async () => {
    csrfGet
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(tokenResponse("tok-1"))

    const handler = captured.request
    if (!handler) throw new Error("no request interceptor")

    await expect(handler(post())).rejects.toThrow("network")

    // The held promise is released when it settles either way, so this is a
    // fresh attempt rather than an await on the rejection above.
    const config = (await handler(post())) as Config
    expect(config.headers?.["X-XSRF-TOKEN"]).toBe("tok-1")
    expect(csrfGet).toHaveBeenCalledTimes(2)
  })

  it("asks for no token on a read, and none for the csrf endpoint itself", async () => {
    const handler = captured.request
    if (!handler) throw new Error("no request interceptor")

    await handler(post({ method: "get" }))
    await handler(post({ url: "/csrf", method: "post" }))

    expect(csrfGet).not.toHaveBeenCalled()
  })
})

describe("the response interceptor", () => {
  it("takes one fresh token and retries a 403 once", async () => {
    csrfGet.mockResolvedValue(tokenResponse("tok-2"))
    const handler = captured.responseError
    if (!handler) throw new Error("no response interceptor")

    const config = post()
    await handler({ response: { status: 403, headers: {} }, config })

    expect(config._csrfRetried).toBe(true)
    expect(config.headers?.["X-XSRF-TOKEN"]).toBe("tok-2")
    expect(axiosRequest).toHaveBeenCalledWith(config)
  })

  it("gives up on a 403 it has already retried", async () => {
    csrfGet.mockResolvedValue(tokenResponse("tok-2"))
    const handler = captured.responseError
    if (!handler) throw new Error("no response interceptor")

    const config = post({ _csrfRetried: true })
    await expect(
      handler({ response: { status: 403, headers: {} }, config }),
    ).rejects.toBeDefined()

    expect(axiosRequest).not.toHaveBeenCalled()
  })

  it("sends a 401 to the login route, carrying where the user was", async () => {
    const location = { pathname: "/models/7", search: "?tab=a", href: "" }
    vi.stubGlobal("location", location)

    const handler = captured.responseError
    if (!handler) throw new Error("no response interceptor")

    await expect(
      handler({ response: { status: 401, headers: {} }, config: post() }),
    ).rejects.toBeDefined()

    expect(location.href).toBe("/login?returnUrl=%2Fmodels%2F7%3Ftab%3Da")
  })

  it("does not redirect a 401 that happened on the login page", async () => {
    const location = { pathname: "/login", search: "", href: "" }
    vi.stubGlobal("location", location)

    const handler = captured.responseError
    if (!handler) throw new Error("no response interceptor")

    await expect(
      handler({ response: { status: 401, headers: {} }, config: post() }),
    ).rejects.toBeDefined()

    expect(location.href).toBe("")
  })
})
