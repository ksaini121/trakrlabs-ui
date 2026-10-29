import { Lock } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { StatusCard } from '@/components/layout/StatusCard'
import { buttonClass } from '@/components/ui/buttonClass'
import { IconBubble } from '@/components/ui/IconBubble'
import styles from './StatusPages.module.css'

/** Shown when the API answers 403/404 for a project the user tried to open. */
export function NotAllowedView() {
  return (
    <StatusCard>
      <IconBubble tone="neutral" size="lg">
        <Lock size={18} />
      </IconBubble>
      <h2 className={styles.title}>You don't have access to this project</h2>
      <p className={styles.body}>
        You're not a member of this project, or your access was removed. Ask the project creator to invite you.
      </p>
      <Link to={paths.projects()} className={buttonClass('primary', 'md', styles.start)}>
        Back to projects
      </Link>
    </StatusCard>
  )
}
