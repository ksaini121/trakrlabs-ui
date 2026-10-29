import { Check, TriangleAlert } from 'lucide-react'
import { IconBubble } from '@/components/ui/IconBubble'
import type { ConnectionCheck, ConnectionErrorCode } from '@/types/domain'
import styles from './ConnectionResult.module.css'

type ConnectionError = Extract<ConnectionCheck, { status: 'error' }>

const ERROR_COPY: Record<ConnectionErrorCode, (e: ConnectionError) => { title: string; body: string }> = {
  notFound: (e) => ({
    title: 'Repository not found',
    body: `We couldn't find ${e.repoFullName} with this token. Check the spelling, or make sure the token was created for this repository.`,
  }),
  missingPermission: (e) => ({
    title: 'Token is missing a permission',
    body: `This token can't read ${e.missingPermission ?? 'everything Trakr needs'}. In GitHub, edit the token and set ${e.missingPermission ?? 'Issues and Pull requests'} to Read-only, then check again.`,
  }),
  tokenExpired: () => ({
    title: 'This token has expired',
    body: 'Create a new read-only token in GitHub and paste it here.',
  }),
  orgApproval: (e) => ({
    title: 'Waiting for organisation approval',
    body: `The ${e.repoFullName.split('/')[0]} organisation needs an owner to approve new tokens. Ask an org owner to approve it in GitHub, then check again.`,
  }),
}

export function ConnectionResult({ result }: { result: ConnectionCheck }) {
  if (result.status === 'connected') {
    return (
      <div className={styles.ok} role="status">
        <IconBubble tone="sage" size="sm">
          <Check />
        </IconBubble>
        <div>
          <strong>Connected to {result.repo.fullName}</strong>
          <br />
          {result.openIssueCount} open issues found
        </div>
      </div>
    )
  }

  const copy = ERROR_COPY[result.code](result)
  return (
    <div className={styles.error} role="alert">
      <IconBubble tone="danger" size="sm">
        <TriangleAlert />
      </IconBubble>
      <div className={styles.errorText}>
        <strong>{copy.title}</strong>
        <span>{copy.body}</span>
      </div>
    </div>
  )
}
