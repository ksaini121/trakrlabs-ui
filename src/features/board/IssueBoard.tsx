import { useState, type ReactNode } from 'react'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { buildBoard, cardOptionsFor, effectiveGroup, type BoardGroup } from '@/features/issues/board'
import { applyFilters } from '@/features/issues/filters'
import { IssueFilterMenus, IssueSearchRow, type FilterChange } from '@/features/issues/IssueToolbar'
import type { IssueFilters } from '@/features/issues/filters'
import type { Goal, Issue } from '@/types/domain'
import { BoardColumn, CardSkeleton } from './BoardColumn'
import styles from './IssueBoard.module.css'

interface IssueBoardProps {
  /** Open issues; `undefined` while loading. */
  issues: Issue[] | undefined
  /** Closed this week; `undefined` while loading. Only the status grouping uses it. */
  closedThisWeek: Issue[] | undefined
  /** True when the closed issues were capped, so the column may miss some. */
  closedCapped: boolean
  goals: Goal[]
  hasInsights: boolean
  group: BoardGroup
  onGroupChange: (group: BoardGroup) => void
  filters: IssueFilters
  onFilterChange: FilterChange
  onClearFilters: () => void
  /** Controls at the end of the search row, e.g. the List | Board switch. */
  toolbarEnd?: ReactNode
}

/** "This week" as a read-only board: the same issues and filters as the list, in columns. */
export function IssueBoard(props: IssueBoardProps) {
  const { issues, closedThisWeek, closedCapped, goals, hasInsights, group, onGroupChange, filters, onFilterChange, onClearFilters, toolbarEnd } = props
  const shownGroup = effectiveGroup(group, hasInsights)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const groupOptions: SegmentOption<BoardGroup>[] = [
    { value: 'status', label: 'Status' },
    { value: 'person', label: 'Person' },
    {
      value: 'goal',
      label: 'Goal',
      disabled: !hasInsights,
      title: hasInsights ? undefined : 'Available once Trakr matches issues to goals',
    },
  ]

  // On the status board the columns are the statuses, so a status filter would hide whole columns.
  const effectiveFilters = shownGroup === 'status' ? { ...filters, status: null } : filters
  const columns = issues
    ? buildBoard({
        open: applyFilters(issues, effectiveFilters),
        closedThisWeek: applyFilters(closedThisWeek ?? [], { ...effectiveFilters, status: null }),
        goals,
        group: shownGroup,
        hasInsights,
      })
    : undefined

  return (
    <div className={styles.root}>
      <IssueSearchRow filters={filters} onFilterChange={onFilterChange} onClearFilters={onClearFilters} end={toolbarEnd} />

      <div className={styles.toolbar}>
        <div className={styles.groupBy}>
          <span className={styles.groupLabel} aria-hidden>
            Group by
          </span>
          <SegmentedControl label="Group by" options={groupOptions} value={shownGroup} onChange={onGroupChange} />
        </div>
        <IssueFilterMenus
          issues={issues}
          filters={filters}
          onFilterChange={onFilterChange}
          hasInsights={hasInsights}
          showStatus={shownGroup !== 'status'}
        />
      </div>

      <div className={styles.scroller} tabIndex={0} role="region" aria-label="Issue board">
        <div className={styles.columns}>
          {columns
            ? columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  goals={goals}
                  cardOptions={cardOptionsFor(shownGroup)}
                  expanded={expanded.has(column.id)}
                  onExpand={() => setExpanded((prev) => new Set(prev).add(column.id))}
                  loading={column.id === 'closed' && closedThisWeek === undefined}
                  footnote={column.id === 'closed' && closedCapped ? 'From the last 1,000 closed issues.' : undefined}
                />
              ))
            : [0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonColumn} aria-hidden>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
