import { CircleHelp, GitPullRequest, MessageSquare, Pause, UserRound } from 'lucide-react'
import { daysSince, formatRelative } from '@/lib/dates'
import type { Issue, IssueLabel } from '@/types/domain'
import { isUnassigned } from './filters'
import styles from './IssueMeta.module.css'

/** "updated 3 hours ago", or "no activity for 9 days" when stalled. */
function activityText(issue: Issue): string {
  if (issue.state === 'closed' && issue.closedAt) return `closed ${formatRelative(issue.closedAt)}`
  return issue.isStalled ? `no activity for ${daysSince(issue.updatedAt)} days` : `updated ${formatRelative(issue.updatedAt)}`
}

/** "#214 · updated 3 hours ago · 4 comments" */
export function IssueActivity({ issue }: { issue: Issue }) {
  return (
    <>
      #{issue.number} · {activityText(issue)}
      {issue.commentsCount > 0 && ' · '}
      {issue.commentsCount > 0 && (
        <span className={styles.comments}>
          <MessageSquare size={12} aria-hidden />
          {issue.commentsCount}
          <span className="sr-only"> comments</span>
        </span>
      )}
    </>
  )
}

export function LabelPill({ label }: { label: IssueLabel }) {
  return (
    <span className={styles.label}>
      <span className={styles.labelDot} style={{ background: label.color }} />
      {label.name}
    </span>
  )
}

interface IssueBadgesProps {
  issue: Issue
  /** Set false where the surrounding group already says it (a board column of stalled issues). */
  showStalled?: boolean
  showUnassigned?: boolean
  showOpenPr?: boolean
}

/** Status pills. Only Stalled and Unassigned are loud; everything else stays quiet. */
export function IssueBadges({ issue, showStalled = true, showUnassigned = true, showOpenPr = true }: IssueBadgesProps) {
  return (
    <>
      {showStalled && issue.isStalled && (
        <span className={`${styles.badge} ${styles.stalled}`}>
          <Pause size={11} />
          Stalled
        </span>
      )}
      {showUnassigned && isUnassigned(issue) && issue.state === 'open' && (
        <span className={`${styles.badge} ${styles.unassigned}`}>
          <UserRound size={13} />
          Unassigned
        </span>
      )}
      {showOpenPr && issue.insight?.hasOpenPr && (
        <span className={`${styles.badge} ${styles.pr}`}>
          <GitPullRequest size={13} />
          Open PR
        </span>
      )}
      {issue.insight?.needsDetail && (
        <span className={`${styles.badge} ${styles.vague}`}>
          <CircleHelp size={13} />
          Needs detail
        </span>
      )}
    </>
  )
}
