import { ApiError, errorFromResponse } from './errors'

/**
 * HTTP client for the FastAPI backend.
 *
 * - Empty `VITE_API_URL` (development): calls go to the same origin and the Vite
 *   proxy forwards them, so the session cookie just works.
 * - `VITE_USE_MOCKS=true`: calls go to the in-browser mock backend instead,
 *   which answers with the same JSON shapes as FastAPI.
 * - Sends the session cookie (`credentials: 'include'`) and adds
 *   `X-Requested-With` on writes, which the backend uses as a CSRF guard.
 */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS === 'true'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface HttpRequest {
  method: HttpMethod
  path: string
  query?: QueryParams
  json?: unknown
}

export interface HttpResponse {
  status: number
  statusText?: string
  /** Parsed JSON body, or null when there is none. */
  body: unknown
}

export type Transport = (request: HttpRequest) => Promise<HttpResponse>

export function buildUrl(path: string, query?: QueryParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`
}

const fetchTransport: Transport = async ({ method, path, query, json }) => {
  const isWrite = method !== 'GET'
  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(isWrite ? { 'X-Requested-With': 'trakr' } : {}),
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })
  const text = response.status === 204 ? '' : await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { detail: text }
    }
  }
  return { status: response.status, statusText: response.statusText, body }
}

/** Loaded on first use so the mock backend never ships in a production bundle. */
const mockTransport: Transport = async (request) => {
  const { mockBackend } = await import('@/mocks/backend')
  return mockBackend(request)
}

const transport: Transport = USE_MOCKS ? mockTransport : fetchTransport

/** Sends one request and returns the parsed body, or rejects with an `ApiError`. */
export async function http<T>(method: HttpMethod, path: string, options: { query?: QueryParams; json?: unknown } = {}): Promise<T> {
  let response: HttpResponse
  try {
    response = await transport({ method, path, ...options })
  } catch {
    throw new ApiError(0, 'network', "Can't reach Trakr right now.")
  }
  if (response.status < 200 || response.status >= 300) {
    throw errorFromResponse(response.status, response.body, response.statusText)
  }
  return response.body as T
}
