import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'
import { queryKeys } from '@/api/queryKeys'
import { markSessionExpired } from '@/features/auth/sessionExpiry'
import { toast } from '@/stores/toastStore'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Set when the screen shows this mutation's errors itself, to skip the global error toast. */
      handlesErrors?: boolean
    }
  }
}

/** A 401 from any call after sign-in means the session ended: drop it so routes redirect. */
function handleUnauthorized(error: unknown, isSessionQuery: boolean): boolean {
  if (!isSessionQuery && isApiError(error) && error.code === 'unauthorized') {
    markSessionExpired()
    queryClient.setQueryData(queryKeys.session, null)
    return true
  }
  return false
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => handleUnauthorized(error, query.queryKey[0] === queryKeys.session[0]),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (handleUnauthorized(error, false) || mutation.meta?.handlesErrors) return
      // Validation errors belong next to their field; everything else gets one toast.
      if (isApiError(error) && error.code === 'validation') return
      toast.error(isApiError(error) && error.code === 'network' ? "Can't reach Trakr right now." : 'Something went wrong. Try again.')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Auth, permission, missing-resource and validation errors won't fix themselves on retry.
      retry: (failureCount, error) =>
        isApiError(error) && ['unauthorized', 'forbidden', 'notFound', 'validation'].includes(error.code)
          ? false
          : failureCount < 2,
    },
  },
})
