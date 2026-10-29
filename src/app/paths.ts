/** Typed URL builders, so links never drift from the route table in `router.tsx`. */

export type SignInReason = 'cancelled' | 'failed' | 'expired'

interface SignInParams {
  next?: string
  reason?: SignInReason
}

function withQuery(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export const paths = {
  signIn: (params: SignInParams = {}) => withQuery('/sign-in', { ...params }),
  projects: () => '/projects',
  createProject: () => '/projects/new',
  dashboard: (projectId: string) => `/projects/${projectId}`,
  firstSync: (projectId: string) => `/projects/${projectId}/sync`,
}

/** Only allow in-app redirects after sign-in, never another origin. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : paths.projects()
}
