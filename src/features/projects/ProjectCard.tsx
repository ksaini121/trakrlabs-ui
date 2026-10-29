import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { AvatarStack } from '@/components/ui/Avatar'
import { GitHubIcon } from '@/components/ui/GitHubIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelative } from '@/lib/dates'
import type { Project } from '@/types/domain'
import styles from './ProjectCard.module.css'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={paths.dashboard(project.id)} className={styles.card}>
      <span className={styles.name}>{project.name}</span>
      <span className={styles.repo}>
        <GitHubIcon />
        {project.repo.fullName}
      </span>
      <span className={styles.footer}>
        {/* Members and last sync are placeholders until ProjectOut has them (TODO(api)); hidden while empty. */}
        {project.members.length > 0 && <AvatarStack people={project.members} />}
        <span className={styles.synced}>
          {project.lastSyncedAt ? `Synced ${formatRelative(project.lastSyncedAt)}` : `Created ${formatRelative(project.createdAt)}`}
        </span>
      </span>
    </Link>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" height={12} />
      <span className={styles.footer}>
        <Skeleton width="30%" height={12} />
      </span>
    </div>
  )
}
