import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { StatusCard } from '@/components/layout/StatusCard'
import { buttonClass } from '@/components/ui/buttonClass'
import styles from './StatusPages.module.css'

export function NotFoundPage() {
  return (
    <StatusCard>
      <h2 className={styles.title}>Page not found</h2>
      <p className={styles.body}>The link may be old, or the page may have moved.</p>
      <Link to={paths.projects()} className={buttonClass('primary', 'md', styles.start)}>
        Go to my projects
      </Link>
    </StatusCard>
  )
}
