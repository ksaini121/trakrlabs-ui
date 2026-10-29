import { RefreshCw, UserPlus } from 'lucide-react'
import { AvatarStack } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { GitHubIcon } from '@/components/ui/GitHubIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { formatRelative } from '@/lib/dates'
import type { Person, Project } from '@/types/domain'
import styles from './DashboardHeader.module.css'

interface DashboardHeaderProps {
  project: Project | undefined
  /** Newest synced_at across the project's issues; null before the first sync. */
  lastSyncedAt: string | null
  /** Everyone in the project, for the avatar stack. Hidden while loading. */
  people: Person[] | undefined
  syncing: boolean
  onSyncNow: () => void
  onInvite: () => void
}

export function DashboardHeader({ project, lastSyncedAt, people, syncing, onSyncNow, onInvite }: DashboardHeaderProps) {
  if (!project) {
    return (
      <div className={styles.header} aria-hidden>
        <div className={styles.titles}>
          <Skeleton width="260px" height={30} />
          <Skeleton width="180px" height={12} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>{project.name}</h1>
        <div className={styles.meta}>
          <a href={project.repo.url} target="_blank" rel="noopener noreferrer" className={styles.repo}>
            <GitHubIcon />
            {project.repo.fullName}
          </a>
          <span className={styles.dot} aria-hidden />
          {syncing ? (
            <span className={styles.syncing} role="status">
              <Spinner />
              Syncing with GitHub…
            </span>
          ) : (
            <>
              <span>{lastSyncedAt ? `Synced ${formatRelative(lastSyncedAt)}` : 'Not synced yet'}</span>
              <Button variant="ghost" icon={<RefreshCw size={15} />} onClick={onSyncNow}>
                Sync now
              </Button>
            </>
          )}
        </div>
      </div>
      <div className={styles.team}>
        {people && people.length > 0 && <AvatarStack people={people} size="sm" ring="var(--color-bg)" max={6} />}
        <Button icon={<UserPlus />} className={styles.invite} onClick={onInvite}>
          Invite
        </Button>
      </div>
    </div>
  )
}
