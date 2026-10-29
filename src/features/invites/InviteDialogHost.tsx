import { useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import { useCreateProjectStore, useUiStore } from '@/stores'
import { InviteTeamDialog } from './InviteTeamDialog'

/**
 * The one invite popup, opened through `useUiStore().openInvite(...)` from the
 * dashboard or the create-project flow. Rendered once in the app layout.
 */
export function InviteDialogHost() {
  const dialog = useUiStore((s) => s.inviteDialog)
  const closeInvite = useUiStore((s) => s.closeInvite)
  const finishCreateFlow = useCreateProjectStore((s) => s.reset)
  const navigate = useNavigate()

  if (!dialog) return null

  const onClose = () => {
    closeInvite()
    if (dialog.mode === 'onboarding') {
      // The project already exists, so closing the popup any way moves on to step 3.
      finishCreateFlow()
      navigate(paths.firstSync(dialog.projectId), { replace: true })
    }
  }

  return (
    <InviteTeamDialog
      open
      projectId={dialog.projectId}
      projectName={dialog.projectName}
      mode={dialog.mode}
      onClose={onClose}
    />
  )
}
