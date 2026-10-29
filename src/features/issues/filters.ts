/**
 * Filtering, sorting and grouping for the "This week" list.
 * Pure functions over the project's open issues, so they are easy to test.
 *
 * Until the API ranks issues against goals (TODO(api)), issues carry no
 * `insight`: the list is one group, newest activity first, and the AI-only
 * filters (Open PR, Needs detail) and goal groups stay hidden.
 */
import type { Goal, Issue, IssueLabel, Person } from '@/types/domain'

export type StatusFilter = 'openPr' | 'stalled' | 'unassigned' | 'needsDetail'
export type SortOrder = 'importance' | 'updated'
/** A GitHub login, or "none" for unassigned issues. */
export type AssigneeFilter = string

export interface IssueFilters {
  q: string
  status: StatusFilter | null
  assignee: AssigneeFilter | null
  label: string | null
  sort: SortOrder
}

export const DEFAULT_FILTERS: IssueFilters = { q: '', status: null, assignee: null, label: null, sort: 'importance' }

const ALL_STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string; needsInsights: boolean }> = [
  { value: 'openPr', label: 'Open PR', needsInsights: true },
  { value: 'stalled', label: 'Stalled', needsInsights: false },
  { value: 'unassigned', label: 'Unassigned', needsInsights: false },
  { value: 'needsDetail', label: 'Needs detail', needsInsights: true },
]

/** Status filters that make sense for the list: Open PR and Needs detail need AI insights. */
export function statusOptions(hasInsights: boolean): Array<{ value: StatusFilter; label: string }> {
  return ALL_STATUS_OPTIONS.filter((o) => hasInsights || !o.needsInsights).map(({ value, label }) => ({ value, label }))
}

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOrder; label: string }> = [
  { value: 'importance', label: 'Most important first' },
  { value: 'updated', label: 'Recently updated' },
]

export function isStatusFilter(value: string | null): value is StatusFilter {
  return ALL_STATUS_OPTIONS.some((o) => o.value === value)
}

export function hasActiveFilters(filters: IssueFilters): boolean {
  return Boolean(filters.q.trim() || filters.status || filters.assignee || filters.label)
}

export function isUnassigned(issue: Issue): boolean {
  return issue.assignees.length === 0
}

/** Goal-critical and unassigned or stalled: what the "Needs attention" group pulls to the top. */
export function needsAttention(issue: Issue): boolean {
  return issue.insight?.goalIndex != null && (isUnassigned(issue) || issue.isStalled)
}

function matchesStatus(issue: Issue, status: StatusFilter): boolean {
  switch (status) {
    case 'openPr':
      return Boolean(issue.insight?.hasOpenPr)
    case 'stalled':
      return issue.isStalled
    case 'unassigned':
      return isUnassigned(issue)
    case 'needsDetail':
      return Boolean(issue.insight?.needsDetail)
  }
}

export function applyFilters(issues: Issue[], filters: IssueFilters): Issue[] {
  const q = filters.q.trim().toLowerCase().replace(/^#/, '')
  return issues.filter(
    (issue) =>
      (!filters.status || matchesStatus(issue, filters.status)) &&
      (!filters.assignee ||
        (filters.assignee === 'none'
          ? isUnassigned(issue)
          : issue.assignees.some((a) => a.login === filters.assignee))) &&
      (!filters.label || issue.labels.some((l) => l.name === filters.label)) &&
      (!q || issue.title.toLowerCase().includes(q) || String(issue.number).includes(q)),
  )
}

export type IssueGroup =
  | { kind: 'attention'; key: string; issues: Issue[] }
  | { kind: 'goal'; key: string; goalIndex: number; goal: Goal; issues: Issue[]; hasNoMatches: boolean }
  | { kind: 'other'; key: string; issues: Issue[] }
  | { kind: 'recent'; key: string; issues: Issue[] }

export function goalGroupId(goalIndex: number): string {
  return `goal-group-${goalIndex}`
}

const byNewestActivity = (a: Issue, b: Issue) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)

/**
 * - No insights yet, or "Recently updated": one list, newest activity first.
 * - "Most important first" with insights: Needs attention, one group per goal
 *   (in the API's rank order), then the issues that serve no goal.
 * While filters are active, goal groups with nothing left are hidden.
 */
export function groupIssues(filtered: Issue[], goals: Goal[], filters: IssueFilters, hasInsights: boolean): IssueGroup[] {
  if (!hasInsights || filters.sort === 'updated') {
    const issues = [...filtered].sort(byNewestActivity)
    return issues.length ? [{ kind: 'recent', key: 'recent', issues }] : []
  }

  const groups: IssueGroup[] = []
  const attention = filtered.filter(needsAttention)
  if (attention.length) groups.push({ kind: 'attention', key: 'attention', issues: attention })

  const filtering = hasActiveFilters(filters)
  goals.forEach((goal, goalIndex) => {
    const forGoal = filtered.filter((i) => i.insight?.goalIndex === goalIndex)
    const issues = forGoal.filter((i) => !needsAttention(i))
    if (filtering && !issues.length) return
    groups.push({ kind: 'goal', key: goalGroupId(goalIndex), goalIndex, goal, issues, hasNoMatches: !forGoal.length })
  })

  const other = filtered
    .filter((i) => i.insight?.goalIndex == null || i.insight.goalIndex >= goals.length)
    .sort(byNewestActivity)
  if (other.length) groups.push({ kind: 'other', key: 'other', issues: other })
  return groups
}

/** Distinct labels across the list, for the Labels filter. */
export function labelsIn(issues: Issue[]): IssueLabel[] {
  const seen = new Map<string, IssueLabel>()
  for (const issue of issues) for (const label of issue.labels) if (!seen.has(label.name)) seen.set(label.name, label)
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Distinct assignees across the list, for the Assignee filter. */
export function assigneesIn(issues: Issue[]): Person[] {
  const seen = new Map<string, Person>()
  for (const issue of issues) for (const person of issue.assignees) if (!seen.has(person.login)) seen.set(person.login, person)
  return [...seen.values()].sort((a, b) => a.login.localeCompare(b.login))
}

export function countForGoal(issues: Issue[], goalIndex: number): number {
  return issues.filter((i) => i.insight?.goalIndex === goalIndex).length
}
