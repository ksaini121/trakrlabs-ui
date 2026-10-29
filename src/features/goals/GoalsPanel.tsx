import { Calendar, History, Pencil, Plus, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import { cn } from '@/lib/cn'
import { formatDateTime, formatDueDate, formatWeekRange } from '@/lib/dates'
import { MAX_GOALS, type Goal, type GoalVersion, type Week } from '@/types/domain'
import type { GoalsLayout } from '@/stores/preferencesStore'
import styles from './GoalsPanel.module.css'

interface GoalsPanelProps {
  layout: GoalsLayout
  week: Week
  current: GoalVersion | null
  /** Open-issue count per goal index (sidebar shows it under each goal). */
  issueCounts?: number[]
  onEdit: () => void
  onShowHistory: () => void
  onSelectGoal?: (goalIndex: number) => void
  /** A line under the panel, e.g. the preview note while goals aren't saved to the server. */
  note?: ReactNode
}

/** "This week's goals": up to three goal cards, plus who last edited them. */
export function GoalsPanel({ layout, week, current, issueCounts, onEdit, onShowHistory, onSelectGoal, note }: GoalsPanelProps) {
  const goals = current?.goals ?? []
  const slots = Array.from({ length: MAX_GOALS }, (_, i) => goals[i] ?? null)
  const sidebar = layout === 'sidebar'

  return (
    <section className={cn(styles.panel, sidebar && styles.sidebar)} aria-labelledby="goals-heading">
      <div className={styles.header}>
        <h2 id="goals-heading" className={styles.title}>
          This week's goals
        </h2>
        <span className={styles.week}>{formatWeekRange(week)}</span>
        {current && !sidebar && (
          <Button variant="soft" icon={<Pencil size={14} />} className={styles.editTop} onClick={onEdit}>
            Edit goals
          </Button>
        )}
      </div>

      <div className={styles.cards}>
        {slots.map((goal, index) =>
          goal ? (
            <GoalCard
              key={index}
              index={index}
              goal={goal}
              compact={sidebar}
              countLabel={sidebar && issueCounts ? countLabel(issueCounts[index] ?? 0) : undefined}
              onSelect={onSelectGoal ? () => onSelectGoal(index) : undefined}
            />
          ) : (
            <button key={index} type="button" className={cn(styles.addCard, sidebar && styles.addCompact)} onClick={onEdit}>
              <IconBubble tone="neutral" size="sm">
                <Plus />
              </IconBubble>
              <span>Add goal {index + 1}</span>
            </button>
          ),
        )}
      </div>

      {current ? (
        <div className={styles.edited}>
          {sidebar && (
            <Button variant="soft" icon={<Pencil size={14} />} onClick={onEdit}>
              Edit goals
            </Button>
          )}
          <div className={styles.editedLine}>
            {!sidebar && <Avatar person={current.editedBy} size="xs" />}
            <span>
              Edited by <strong className={styles.editor}>{current.editedBy.name}</strong> · {formatDateTime(current.editedAt)}
            </span>
            <Button variant="ghost" size="sm" icon={<History size={14} />} onClick={onShowHistory}>
              History
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.noGoals}>
          {!sidebar && (
            <span className={styles.noGoalsText}>
              No goals yet this week. Add up to three so the team knows what matters most.
            </span>
          )}
          <Button variant="primary" icon={<Plus />} onClick={onEdit}>
            Add goals
          </Button>
        </div>
      )}
      {note}
    </section>
  )
}

function countLabel(n: number): string {
  return `${n} open issue${n === 1 ? '' : 's'}`
}

interface GoalCardProps {
  index: number
  goal: Goal
  compact: boolean
  countLabel?: string
  onSelect?: () => void
}

function GoalCard({ index, goal, compact, countLabel, onSelect }: GoalCardProps) {
  const body = (
    <>
      <IconBubble tone="number" size={compact ? 'xs' : 'sm'}>
        {index + 1}
      </IconBubble>
      <div className={styles.goalBody}>
        <div className={styles.goalText}>{goal.goal}</div>
        <div className={styles.goalMeta}>
          {goal.target && (
            <span>
              <Target size={14} />
              {goal.target}
            </span>
          )}
          {goal.dueDate && (
            <span>
              <Calendar size={14} />
              {formatDueDate(goal.dueDate)}
            </span>
          )}
          {countLabel && <span className={styles.count}>{countLabel}</span>}
        </div>
      </div>
    </>
  )

  if (compact && onSelect) {
    return (
      <button type="button" className={cn(styles.goalCard, styles.goalCompact, styles.clickable)} onClick={onSelect}>
        {body}
      </button>
    )
  }
  return <div className={cn(styles.goalCard, compact && styles.goalCompact)}>{body}</div>
}
