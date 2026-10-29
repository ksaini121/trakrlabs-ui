import { useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { GitHubIcon } from '@/components/ui/GitHubIcon'
import { useToast } from '@/components/ui/toast-context'
import { useAcceptInvite, useDeclineInvite } from '@/features/invites/hooks'
import type { PendingInvite } from '@/types/domain'
import styles from './PendingInviteCard.module.css'

export function PendingInviteCard({ invite }: { invite: PendingInvite }) {
  const navigate = useNavigate()
  const toast = useToast()
  const accept = useAcceptInvite()
  const decline = useDeclineInvite()
  const busy = accept.isPending || decline.isPending

  return (
    <div className={styles.card}>
      <Avatar person={invite.invitedBy} size="lg" />
      <div className={styles.text}>
        <div>
          <strong>{invite.invitedBy.name}</strong> invited you to <strong>{invite.project.name}</strong>
        </div>
        <div className={styles.repo}>
          <GitHubIcon />
          {invite.project.repo.fullName}
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          loading={decline.isPending}
          disabled={busy}
          onClick={() => decline.mutate(invite.id, { onSuccess: () => toast.show('Invite declined') })}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          loading={accept.isPending}
          disabled={busy}
          onClick={() =>
            accept.mutate(invite.id, {
              onSuccess: (project) => {
                toast.show(`Joined ${project.name}`)
                navigate(paths.dashboard(project.id))
              },
            })
          }
        >
          Join
        </Button>
      </div>
    </div>
  )
}
