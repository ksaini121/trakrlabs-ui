import { CircleDot, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { Goal, Issue } from '@/types/domain'
import { IssueRow } from './IssueRow'
import { applyFilters, groupIssues, hasActiveFilters, needsAttention, type IssueFilters, type IssueGroup } from './filters'
import { IssueFilterMenus, IssueSearchRow, type FilterChange } from './IssueToolbar'
import styles from './WeeklyIssueList.module.css'

interface WeeklyIssueListProps {
  /** `undefined` while loading. */
  issues: Issue[] | undefined
  goals: Goal[]
  /** True once issues carry AI insights: turns on goal groups, sorting and the AI-only filters. */
  hasInsights: boolean
  filters: IssueFilters
  onFilterChange: FilterChange
  onClearFilters: () => void
  /** Controls at the end of the search row, e.g. the List | Board switch. */
  toolbarEnd?: ReactNode
}

export function WeeklyIssueList({ issues, goals, hasInsights, filters, onFilterChange, onClearFilters, toolbarEnd }: WeeklyIssueListProps) {
  const loading = issues === undefined
  const filtered = issues ? applyFilters(issues, filters) : []
  const groups = issues ? groupIssues(filtered, goals, filters, hasInsights) : []
  const filtering = hasActiveFilters(filters)
  const attentionCount = filtered.filter(needsAttention).length

  return (
    <div className={styles.root}>
      <IssueSearchRow filters={filters} onFilterChange={onFilterChange} onClearFilters={onClearFilters} end={toolbarEnd} />

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <span className={styles.openCount}>
            <CircleDot className={styles.openIcon} />
            {loading ? '–' : filtered.length} open
          </span>
          {attentionCount > 0 && <span className={styles.attnCount}>{attentionCount} need attention</span>}
          <IssueFilterMenus
            issues={issues}
            filters={filters}
            onFilterChange={onFilterChange}
            hasInsights={hasInsights}
            showSort={hasInsights}
          />
        </div>

        {loading && <ListSkeleton />}

        {!loading && !filtering && !issues.length && (
          <div className={styles.noResults}>
            <strong>No open issues</strong>
            <span className="muted">Nothing is open in this repository, or it hasn't synced yet. Try Sync now.</span>
          </div>
        )}

        {!loading && filtering && !filtered.length && (
          <div className={styles.noResults}>
            <strong>No issues match these filters</strong>
            <Button onClick={onClearFilters}>Clear filters</Button>
          </div>
        )}

        {groups.map((group) => (
          <IssueGroupSection key={group.key} group={group} goals={goals} />
        ))}
        <div className={styles.bottomPad} />
      </div>
    </div>
  )
}

function IssueGroupSection({ group, goals }: { group: IssueGroup; goals: Goal[] }) {
  const goalOf = (issue: Issue) => {
    const index = issue.insight?.goalIndex
    return index != null && goals[index] ? { index, goal: goals[index] } : undefined
  }

  return (
    <section id={group.key} aria-label={groupLabel(group)}>
      {group.kind === 'attention' && (
        <div className={cn(styles.groupHeader, styles.attention)}>
          <TriangleAlert className={styles.attentionIcon} />
          <span className={styles.groupTitle}>Needs attention</span>
          <span className={styles.groupSub}>Goal-critical issues that are unassigned or stalled</span>
          <span className={styles.groupCount}>{group.issues.length}</span>
        </div>
      )}
      {group.kind === 'goal' && (
        <div className={styles.groupHeader}>
          <IconBubble tone="number" size="xs">
            {group.goalIndex + 1}
          </IconBubble>
          <span className={styles.groupTitle}>{group.goal.goal}</span>
          {group.goal.target && <span className={styles.groupSub}>{group.goal.target}</span>}
          <span className={styles.groupCount}>{group.issues.length}</span>
        </div>
      )}
      {group.kind === 'other' && (
        <div className={styles.groupHeader}>
          <span className={styles.groupTitle}>Other open issues</span>
          <span className={styles.groupSub}>Not matched to this week's goals</span>
          <span className={styles.groupCount}>{group.issues.length}</span>
        </div>
      )}
      {group.kind === 'recent' && (
        <div className={styles.groupHeader}>
          <span className={styles.groupTitle}>Recently updated</span>
          <span className={styles.groupCount}>{group.issues.length}</span>
        </div>
      )}

      {group.kind === 'goal' && group.hasNoMatches && <div className={styles.goalEmpty}>No open issues match this goal.</div>}

      <ul className={styles.rows}>
        {group.issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} goal={group.kind === 'goal' ? undefined : goalOf(issue)} />
        ))}
      </ul>
    </section>
  )
}

function groupLabel(group: IssueGroup): string {
  if (group.kind === 'attention') return 'Needs attention'
  if (group.kind === 'recent') return 'Recently updated'
  if (group.kind === 'other') return 'Other open issues'
  return `Goal ${group.goalIndex + 1}: ${group.goal.goal}`
}

function ListSkeleton() {
  return (
    <div aria-busy aria-label="Loading issues">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton shape="circle" height={16} />
          <div className={styles.skeletonText}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="80%" height={10} tone="soft" />
          </div>
          <Skeleton shape="circle" height={26} />
        </div>
      ))}
    </div>
  )
}
