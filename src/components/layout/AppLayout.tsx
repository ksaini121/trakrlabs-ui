import { Outlet } from 'react-router'
import { InviteDialogHost } from '@/features/invites/InviteDialogHost'
import { AppHeader } from './AppHeader'

/** Signed-in shell: header on top, the current page below, and the app-wide popups. */
export function AppLayout() {
  return (
    <>
      <AppHeader />
      <main>
        <Outlet />
      </main>
      <InviteDialogHost />
    </>
  )
}
