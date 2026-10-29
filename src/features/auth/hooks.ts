import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/api'
import { isApiError } from '@/api/errors'
import { queryKeys } from '@/api/queryKeys'
import { resetClientState } from '@/stores'
import type { SessionUser } from '@/types/domain'

/** GET /auth/me. The signed-in user, or `null` when there is no session. */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<SessionUser | null> => {
      try {
        return await authService.me()
      } catch (error) {
        if (isApiError(error) && error.code === 'unauthorized') return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
  })
}

/** The signed-in user's id, for hooks that map responses relative to "me". */
export function useMeId(): string | null {
  return useSession().data?.id ?? null
}

/**
 * Sends the browser to GitHub through /auth/github/login. Against the real API
 * the page navigates away; in mock mode it signs in and resolves.
 */
export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (next: string) => authService.signIn(next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.session }),
    meta: { handlesErrors: true },
  })
}

/** POST /auth/logout, then forget every cached query and client store. */
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authService.signOut(),
    onSettled: () => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.session[0] })
      queryClient.setQueryData(queryKeys.session, null)
      resetClientState()
    },
  })
}
