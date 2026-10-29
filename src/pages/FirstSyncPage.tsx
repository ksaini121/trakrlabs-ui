import { Check, RefreshCw, Target, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { isApiError } from '@/api/errors'
import { paths } from '@/app/paths'
import { StatusCard } from '@/components/layout/StatusCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { IconBubble } from '@/components/ui/IconBubble'
import { Spinner } from '@/components/ui/Spinner'
import { useSyncIssues } from '@/features/issues/hooks'
import { useProject } from '@/features/projects/hooks'
import statusStyles from './StatusPages.module.css'
import styles from './FirstSyncPage.module.css'

/**
 * Step 3 of 3: the first sync. POST /issue/sync answers when it's done, so this
 * shows a spinner and then the count. TODO(api): a progress bar needs a sync job endpoint.
 */
export function FirstSyncPage() {
  const { projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const sync = useSyncIssues(projectId)

  // Start the first sync once, when the screen opens (the ref also guards StrictMode's double effect).
  const started = useRef(false)
  const { mutate: startSync } = sync
  useEffect(() => {
    if (started.current) return
    started.current = true
    startSync()
  }, [startSync])

  const repoName = project?.repo.fullName ?? 'your repository'
  const failed = sync.isError
  const done = sync.isSuccess
  const synced = sync.data?.synced ?? 0
  const failure = failed && isApiError(sync.error) ? sync.error : null

  return (
    <StatusCard width="lg">
      <div className="eyebrow">Step 3 of 3 · First sync</div>

      <div className={styles.status} role="status" aria-live="polite">
        {done ? (
          <>
            <IconBubble tone="sage" size="sm">
              <Check />
            </IconBubble>
            All issues fetched from {repoName}
          </>
        ) : failed ? (
          <>
            <IconBubble tone="danger" size="sm">
              <TriangleAlert />
            </IconBubble>
            {failure?.code === 'rateLimited' ? 'Sync paused: GitHub rate limit reached' : "We couldn't sync with GitHub"}
          </>
        ) : (
          <>
            <span className={styles.spinner}>
              <Spinner size="lg" />
            </span>
            Fetching issues from {repoName}…
          </>
        )}
      </div>

      {done && (
        <div className={styles.count}>
          <span className={styles.number}>{synced}</span>
          <span className="muted">issue{synced === 1 ? '' : 's'} synced</span>
        </div>
      )}

      {!done && !failed && (
        <p className={statusStyles.body}>This can take a minute for large repositories.</p>
      )}

      {failed ? (
        <>
          <p className={statusStyles.body}>
            {failure && failure.code !== 'unknown' && failure.code !== 'network'
              ? failure.message
              : 'Something went wrong while fetching issues. Try again in a moment.'}
          </p>
          <div className={statusStyles.actions}>
            <Button variant="primary" icon={<RefreshCw size={15} />} loading={sync.isPending} onClick={() => sync.mutate()}>
              Try again
            </Button>
            <Link to={paths.dashboard(projectId)} className={buttonClass('secondary')}>
              Go to dashboard
            </Link>
          </div>
        </>
      ) : (
        <Banner tone="soft" icon={<Target size={16} />}>
          <strong>Next:</strong> add this week's goals
        </Banner>
      )}

      {done && (
        <Link to={paths.dashboard(projectId)} className={buttonClass('primary', 'lg', statusStyles.start)}>
          Go to dashboard
        </Link>
      )}
    </StatusCard>
  )
}
