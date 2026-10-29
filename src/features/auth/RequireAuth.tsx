import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/layout/PageLoader'
import { paths } from '@/app/paths'
import { useSession } from './hooks'
import { consumeSessionExpired } from './sessionExpiry'

/** Layout route: renders child routes only for a signed-in user. */
export function RequireAuth() {
  const { data: user, isPending } = useSession()
  const location = useLocation()

  if (isPending) return <PageLoader />
  if (!user) {
    const next = location.pathname + location.search
    const reason = consumeSessionExpired() ? 'expired' : undefined
    return <Navigate to={paths.signIn({ next, reason })} replace />
  }
  return <Outlet />
}
