import type { SessionUser } from '@/types/domain'
import { buildUrl, http, USE_MOCKS } from '../client'
import type { UserOut } from '../dto'
import { toUser } from '../mappers'

export const authService = {
  /** GET /auth/me. Rejects with `unauthorized` when signed out. */
  me: async (): Promise<SessionUser> => toUser(await http<UserOut>('GET', '/auth/me')),

  /**
   * GET /auth/github/login: a full-page navigation, not a fetch, because the
   * browser must follow the redirects to GitHub and back. The backend returns
   * to `next` once the session cookie is set. Resolves only in mock mode.
   */
  signIn: async (next: string): Promise<void> => {
    if (USE_MOCKS) {
      await http('POST', '/__mock/sign-in')
      return
    }
    window.location.assign(buildUrl('/auth/github/login', { next }))
    return new Promise(() => {}) // the page is navigating away
  },

  /** POST /auth/logout */
  signOut: async (): Promise<void> => {
    await http('POST', '/auth/logout')
  },
}
