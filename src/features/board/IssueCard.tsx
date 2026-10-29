import { Sparkles } from 'lucide-react'
import { AvatarStack, UnassignedAvatar } from '@/components/ui/Avatar'
import { IconBubble } from '@/components/ui/IconBubble'
import { cn } from '@/lib/cn'
import type { Goal, Issue } from '@/types/domain'
import type { CardOptions } from '@/features/issues/board'
import { isUnassigned } from '@/features/issues/filters'
import { IssueActivity, IssueBadges, LabelPill } from '@/features/issues/IssueMeta'
import styles from './IssueCard.module.css'

interface IssueCardProps {
  issue: Issue
  /** This week's goals, to name the goal the issue serves. */
  goals: Goal[]
  options: CardOptions
}

/** One issue on the board. Its title is the only link, so Tab moves card to card. */
export function IssueCard({ issue, goals, options }: IssueCardProps) {
  const goalIndex = issue.insight?.goalIndex
  const goal = options.showGoal && goalIndex != null ? goals.at(goalIndex) : undefined
  const closed = issue.state === 'closed'

  return (
    <article className={cn(styles.card, closed && styles.closed)}>
      {goal && goalIndex != null && (
        <div className={styles.goal}>
          <IconBubble tone="number" size="xs">
            {goalIndex + 1}
          </IconBubble>
          <span className={styles.goalText}>{goal.goal}</span>
        </div>
      )}

      <a href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
        {issue.title}
      </a>

      {issue.insight?.reason && (
        <p className={styles.reason}>
          <Sparkles size={13} className={styles.spark} aria-label="Why it matters" />
          {issue.insight.reason}
        </p>
      )}

      {(issue.labels.length > 0 || options.showStatusBadges || issue.insight?.needsDetail) && (
        <div className={styles.pills}>
          <IssueBadges
            issue={issue}
            showStalled={options.showStatusBadges}
            showUnassigned={options.showStatusBadges}
            showOpenPr={options.showStatusBadges}
          />
          {issue.labels.map((label) => (
            <LabelPill key={label.name} label={label} />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.meta}>
          <IssueActivity issue={issue} />
        </span>
        {isUnassigned(issue) ? (
          !closed && <UnassignedAvatar />
        ) : (
          <AvatarStack people={issue.assignees} size="sm" ring="var(--color-neutral-100)" max={3} />
        )}
      </div>
    </article>
  )
}
