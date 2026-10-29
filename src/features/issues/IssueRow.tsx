import { CircleDot, Sparkles } from 'lucide-react'
import { AvatarStack, UnassignedAvatar } from '@/components/ui/Avatar'
import type { Goal, Issue } from '@/types/domain'
import { isUnassigned } from './filters'
import { IssueActivity, IssueBadges, LabelPill } from './IssueMeta'
import styles from './IssueRow.module.css'

interface IssueRowProps {
  issue: Issue
  /** Shown in rows outside their goal's group (Needs attention, Recently updated). */
  goal?: { index: number; goal: Goal }
}

export function IssueRow({ issue, goal }: IssueRowProps) {
  return (
    <li className={styles.row}>
      <CircleDot className={styles.openIcon} aria-label="Open issue" />
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <a href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
            {issue.title}
          </a>
          {issue.labels.map((label) => (
            <LabelPill key={label.name} label={label} />
          ))}
          <IssueBadges issue={issue} />
        </div>
        {issue.insight?.reason && (
          <div className={styles.reason}>
            <Sparkles size={14} className={styles.spark} aria-label="Why it matters" />
            {issue.insight.reason}
          </div>
        )}
        <div className={styles.meta}>
          <IssueActivity issue={issue} />
          {goal && ` · Goal ${goal.index + 1}: ${goal.goal.goal}`}
        </div>
      </div>
      {isUnassigned(issue) ? <UnassignedAvatar /> : <AvatarStack people={issue.assignees} size="sm" max={3} />}
    </li>
  )
}
