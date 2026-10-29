import { Clock, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/paths'
import { PageLoader } from '@/components/layout/PageLoader'
import { StatusCard } from '@/components/layout/StatusCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { GitHubIcon } from '@/components/ui/GitHubIcon'
import { IconBubble } from '@/components/ui/IconBubble'
import { useToast } from '@/components/ui/toast-context'
import { useSession, useSignOut } from '@/features/auth/hooks'
import { useAcceptInvite, useInvite } from '@/features/invites/hooks'
import type { InviteDetails, SessionUser } from '@/types/domain'
import styles from './StatusPages.module.css'

export function AcceptInvitePage() {
  const { inviteId = '' } = useParams()
  const { data: user } = useSession()
  const { data: invite, isPending, isError } = useInvite(inviteId)

  if (isPending || !user) return <PageLoader />
  if (isError || invite.status === 'expired') return <InviteExpired invite={invite} />

  const emailMismatch = user.email !== null && user.email.toLowerCase() !== invite.sentToEmail.toLowerCase()
  return emailMismatch ? <DifferentAccount invite={invite} user={user} /> : <JoinInvite invite={invite} />
}

type ValidInvite = Extract<InviteDetails, { status: 'valid' }>

function useJoin(invite: ValidInvite) {
  const accept = useAcceptInvite()
  const navigate = useNavigate()
  const toast = useToast()
  const join = () =>
    accept.mutate(invite.id, {
      onSuccess: (project) => {
        toast.show(`Joined ${project.name}`)
        navigate(paths.dashboard(project.id), { replace: true })
      },
    })
  return { join, isPending: accept.isPending, isError: accept.isError }
}

function JoinInvite({ invite }: { invite: ValidInvite }) {
  const { join, isPending, isError } = useJoin(invite)
  return (
    <StatusCard>
      <div className={styles.row}>
        <Avatar person={invite.invitedBy} size="lg" />
        <div>
          <strong>{invite.invitedBy.name}</strong> invited you to join
        </div>
      </div>
      <div>
        <h1 className={styles.heading}>{invite.project.name}</h1>
        <div className={styles.meta}>
          <GitHubIcon />
          {invite.project.repo.fullName} · {invite.project.memberCount} members
        </div>
      </div>
      <p className={styles.body}>
        You'll see this week's goals and the issues that matter for them. You can edit goals too.
      </p>
      {isError && <p className={styles.body}>We couldn't join the project. Please try again.</p>}
      <div className={styles.actions}>
        <Button variant="primary" size="lg" loading={isPending} onClick={join}>
          Join {invite.project.name}
        </Button>
        <Link to={paths.projects()} className={buttonClass('secondary')}>
          Not now
        </Link>
      </div>
    </StatusCard>
  )
}

function DifferentAccount({ invite, user }: { invite: ValidInvite; user: SessionUser }) {
  const { join, isPending } = useJoin(invite)
  const signOut = useSignOut()
  const navigate = useNavigate()
  return (
    <StatusCard>
      <IconBubble tone="accentSoft" size="lg">
        <UserRound size={18} />
      </IconBubble>
      <h2 className={styles.title}>Different account?</h2>
      <p className={styles.body}>
        This invite to <strong>{invite.project.name}</strong> was sent to <strong>{invite.sentToEmail}</strong>. You're
        signed in to GitHub as <strong>@{user.login}</strong>.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" loading={isPending} onClick={join}>
          Join with this account
        </Button>
        <Button
          loading={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: () => navigate(paths.signIn({ invite: invite.id }), { replace: true }),
            })
          }
        >
          Switch GitHub account
        </Button>
      </div>
    </StatusCard>
  )
}

function InviteExpired({ invite }: { invite: InviteDetails | undefined }) {
  return (
    <StatusCard>
      <IconBubble tone="neutral" size="lg">
        <Clock size={18} />
      </IconBubble>
      <h2 className={styles.title}>This invite is no longer valid</h2>
      <p className={styles.body}>
        {invite
          ? `It may have expired or been withdrawn. Ask ${invite.invitedBy.name}, who invited you to ${invite.project.name}, to send you a new one.`
          : 'It may have expired or been withdrawn. Ask the person who invited you to send a new one.'}
      </p>
      <Link to={paths.projects()} className={buttonClass('primary', 'md', styles.start)}>
        Go to my projects
      </Link>
    </StatusCard>
  )
}
