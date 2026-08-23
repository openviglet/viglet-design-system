import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

const CSRF_HEADER = "X-XSRF-TOKEN";
const CSRF_ENDPOINT = "/csrf";
let csrfToken: string | null = null;

const csrfClient = axios.create({ withCredentials: true });

function isMutatingMethod(method?: string): boolean {
  return ["post", "put", "delete", "patch"].includes(
    method?.toLowerCase() || "",
  );
}

function readCsrfTokenFromHeaders(headers: unknown): string | null {
  if (!headers) return null;

  if (
    typeof headers === "object" &&
    headers !== null &&
    "get" in headers &&
    typeof (headers as { get: (name: string) => string | undefined }).get ===
      "function"
  ) {
    const value = (
      headers as { get: (name: string) => string | undefined }
    ).get(CSRF_HEADER);
    return value || null;
  }

  if (typeof headers === "object" && headers !== null) {
    const value = (headers as Record<string, string | undefined>)[
      CSRF_HEADER.toLowerCase()
    ];
    return value || null;
  }

  return null;
}

function setRequestHeader(config: { headers?: unknown }, token: string): void {
  if (
    typeof config.headers === "object" &&
    config.headers !== null &&
    "set" in config.headers &&
    typeof (config.headers as { set: (name: string, value: string) => void })
      .set === "function"
  ) {
    (config.headers as { set: (name: string, value: string) => void }).set(
      CSRF_HEADER,
      token,
    );
    return;
  }

  const headers = (config.headers as Record<string, string | undefined>) || {};
  headers[CSRF_HEADER] = token;
  config.headers = headers;
}

function clearCsrfToken(): void {
  csrfToken = null;
  // The 403 path calls this to force a genuinely fresh token, so a fetch already
  // out — which may be the one that produced the token the server just refused —
  // must not be what the retry ends up awaiting.
  csrfFetch = null;
}

function readCsrfTokenFromCookie(): string | null {
  const regex = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/;
  const match = regex.exec(globalThis.document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * The fetch currently out, if any.
 *
 * The check and the assignment in `ensureCsrfToken` are separated by an await,
 * so without this every mutating request that started while the first was still
 * out saw a null token and fetched its own — two concurrent POSTs measured two
 * `/csrf` calls, N of them make N. That is not only round trips: a server that
 * rotates its token on issue invalidates the earlier one when it issues the
 * later, so the first racer carries a replaced token and comes back 403. The
 * response interceptor retries such a request once, which hides the symptom at
 * the cost of another round trip, and only once.
 *
 * Cleared when the fetch settles, either way, so a failure does not leave every
 * later request awaiting a rejection that will never be retried.
 */
let csrfFetch: Promise<void> | null = null;

async function fetchCsrfToken(): Promise<void> {
  csrfClient.defaults.baseURL = axios.defaults.baseURL;
  const response = await csrfClient.get(CSRF_ENDPOINT);
  const headerToken = readCsrfTokenFromHeaders(response.headers);
  const bodyToken =
    typeof response.data === "object" && response.data !== null
      ? (response.data as { token?: string }).token
      : undefined;
  const cookieToken = readCsrfTokenFromCookie();

  csrfToken = headerToken || bodyToken || cookieToken || null;
}

async function ensureCsrfToken(): Promise<void> {
  if (csrfToken) return;

  if (!csrfFetch) {
    // Compared before clearing: `clearCsrfToken` can drop this one and a newer
    // fetch take its place while this is still out, and an unconditional reset
    // in the settle handler would then null the newer one out.
    const pending: Promise<void> = fetchCsrfToken().finally(() => {
      if (csrfFetch === pending) csrfFetch = null;
    });
    csrfFetch = pending;
  }

  await csrfFetch;
}

interface SetupAxiosOptions {
  baseURL?: string;
  loginPath?: string;
}

/**
 * Sets up axios with CSRF protection and auth interceptors.
 * Call this once in your app's entry point.
 */
export function setupAxiosInterceptors(options: SetupAxiosOptions = {}) {
  const loginPath = options.loginPath ?? "/login";

  if (options.baseURL) {
    axios.defaults.baseURL = options.baseURL;
  }

  axios.defaults.withCredentials = true;
  axios.defaults.xsrfCookieName = "XSRF-TOKEN";
  axios.defaults.xsrfHeaderName = CSRF_HEADER;

  axios.interceptors.request.use(
    async (config) => {
      const requestUrl = config.url || "";
      const requestBaseUrl = config.baseURL || axios.defaults.baseURL;

      csrfClient.defaults.baseURL = requestBaseUrl;

      if (
        requestUrl.includes(CSRF_ENDPOINT) ||
        !isMutatingMethod(config.method)
      ) {
        return config;
      }

      if (!csrfToken) {
        await ensureCsrfToken();
      }

      if (!csrfToken) {
        throw new Error("Unable to obtain CSRF token for mutating request.");
      }

      setRequestHeader(config, csrfToken);

      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    },
  );

  axios.interceptors.response.use(
    (response) => {
      const tokenFromHeader = readCsrfTokenFromHeaders(response.headers);
      if (tokenFromHeader) {
        csrfToken = tokenFromHeader;
      }
      return response;
    },
    async (error: AxiosError) => {
      const tokenFromHeader = readCsrfTokenFromHeaders(error.response?.headers);
      if (tokenFromHeader) {
        csrfToken = tokenFromHeader;
      }

      const requestConfig = error.config as
        | (AxiosRequestConfig & { _csrfRetried?: boolean })
        | undefined;

      if (
        error.response?.status === 403 &&
        requestConfig &&
        !requestConfig._csrfRetried &&
        isMutatingMethod(requestConfig.method)
      ) {
        requestConfig._csrfRetried = true;
        clearCsrfToken();
        csrfClient.defaults.baseURL =
          requestConfig.baseURL || axios.defaults.baseURL;
        await ensureCsrfToken();

        if (!csrfToken) {
          throw error;
        }

        setRequestHeader(requestConfig, csrfToken);

        return axios.request(requestConfig);
      }

      if (error.response?.status === 401) {
        if (!globalThis.location.pathname.startsWith(loginPath)) {
          const returnUrl = globalThis.location.pathname + globalThis.location.search;
          globalThis.location.href = `${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`;
        }
      }
      throw error;
    },
  );
}

export default axios;
