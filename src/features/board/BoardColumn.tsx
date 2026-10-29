import { useEffect, useId, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { BoardColumn as Column, CardOptions } from '@/features/issues/board'
import type { Goal } from '@/types/domain'
import { IssueCard } from './IssueCard'
import styles from './BoardColumn.module.css'

/** Cards a column shows before "Show N more". */
export const COLUMN_LIMIT = 5

interface BoardColumnProps {
  column: Column
  goals: Goal[]
  cardOptions: CardOptions
  expanded: boolean
  onExpand: () => void
  /** This column's data is still loading (the closed issues come from a second request). */
  loading?: boolean
  /** A line under the cards, e.g. that closed issues were capped. */
  footnote?: string
}

export function BoardColumn({ column, goals, cardOptions, expanded, onExpand, loading, footnote }: BoardColumnProps) {
  const headingId = useId()
  const listRef = useRef<HTMLOListElement>(null)
  const shown = expanded ? column.issues : column.issues.slice(0, COLUMN_LIMIT)
  const hidden = column.issues.length - shown.length
  const count = column.issues.length

  // After "Show more", move focus to the first card that just appeared.
  const wasExpanded = useRef(expanded)
  useEffect(() => {
    if (expanded && !wasExpanded.current) {
      listRef.current?.querySelector<HTMLElement>(`li:nth-child(${COLUMN_LIMIT + 1}) a`)?.focus()
    }
    wasExpanded.current = expanded
  }, [expanded])

  return (
    <section className={cn(styles.column, styles[column.tone])} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          {column.person ? (
            <Avatar person={column.person} size="xs" />
          ) : column.goalIndex != null ? (
            <IconBubble tone="number" size="xs">
              {column.goalIndex + 1}
            </IconBubble>
          ) : (
            <span className={styles.dot} aria-hidden />
          )}
          <h3 id={headingId} className={styles.title}>
            {column.title}
            <span className="sr-only">, {loading ? 'loading' : `${count} issue${count === 1 ? '' : 's'}`}</span>
          </h3>
          <span className={styles.count} aria-hidden>
            {loading ? '–' : count}
          </span>
        </div>
        <p className={styles.description}>{column.description}</p>
      </header>

      {loading ? (
        <div className={styles.cards} aria-busy>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : count === 0 ? (
        <p className={styles.empty}>{column.empty}</p>
      ) : (
        <ol ref={listRef} className={styles.cards}>
          {shown.map((issue) => (
            <li key={issue.id}>
              <IssueCard issue={issue} goals={goals} options={cardOptions} />
            </li>
          ))}
        </ol>
      )}

      {hidden > 0 && !loading && (
        <Button variant="ghost" size="sm" className={styles.more} onClick={onExpand}>
          Show {hidden} more
        </Button>
      )}
      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </section>
  )
}

export function CardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <Skeleton width="80%" height={14} />
      <Skeleton width="55%" height={10} tone="soft" />
      <Skeleton width="35%" height={10} tone="soft" />
    </div>
  )
}
