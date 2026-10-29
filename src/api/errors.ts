export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'rateLimited'
  | 'network'
  | 'unknown'

/** Every failed API call rejects with this, so UI code can branch on `code`. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  /**
   * For 422s: one message per request field, keyed by the field name
   * (`github_repo_name`, `email`…). Empty for other errors.
   */
  readonly fieldErrors: Readonly<Record<string, string>>

  constructor(status: number, code: ApiErrorCode, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status === 400 || status === 409 || status === 422) return 'validation'
  if (status === 429) return 'rateLimited'
  return 'unknown'
}

const GENERIC_MESSAGE = 'Something went wrong. Try again.'

/** Turns FastAPI's "body.github_repo_name" style location into "github_repo_name". */
function fieldName(loc: ReadonlyArray<string | number>): string | null {
  const parts = loc.filter((p): p is string => typeof p === 'string' && !['body', 'query', 'path'].includes(p))
  return parts.length ? parts[parts.length - 1] : null
}

/** FastAPI messages read like "String should match pattern …"; trim the "Value error, " prefix pydantic adds. */
function cleanMessage(msg: string): string {
  return msg.replace(/^Value error,\s*/i, '')
}

/**
 * Builds an ApiError from a failed response body. FastAPI sends either
 * `{ detail: "message" }` or, for 422, `{ detail: [{ loc, msg, type }] }`.
 */
export function errorFromResponse(status: number, body: unknown, statusText = ''): ApiError {
  const code = codeFromStatus(status)
  const detail = (body as { detail?: unknown } | null)?.detail

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    let first: string | null = null
    for (const item of detail as Array<{ loc?: Array<string | number>; msg?: string }>) {
      const msg = cleanMessage(item.msg ?? 'Invalid value.')
      first ??= msg
      const field = item.loc ? fieldName(item.loc) : null
      if (field && !fieldErrors[field]) fieldErrors[field] = msg
    }
    return new ApiError(status, code, first ?? GENERIC_MESSAGE, fieldErrors)
  }

  // Server errors keep a friendly message; their detail is for logs, not people.
  if (typeof detail === 'string' && detail && code !== 'unknown') return new ApiError(status, code, detail)
  return new ApiError(status, code, code === 'unknown' ? GENERIC_MESSAGE : statusText || GENERIC_MESSAGE)
}
