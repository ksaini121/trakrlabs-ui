/**
 * Grouping for the Board view of "This week". Pure functions, tested in board.test.ts.
 *
 * The board is read-only: columns are worked out from each issue's data, never
 * set by moving cards, because Trakr doesn't write to GitHub.
 * Filters are applied before grouping (see IssueBoard).
 */
import { STALLED_AFTER_DAYS } from '@/api/mappers'
import { formatDueDate } from '@/lib/dates'
import type { Goal, Issue, Person } from '@/types/domain'
import { isUnassigned } from './filters'

export type BoardGroup = 'status' | 'person' | 'goal'

export const BOARD_GROUPS: ReadonlyArray<BoardGroup> = ['status', 'person', 'goal']

export function isBoardGroup(value: string | null): value is BoardGroup {
  return BOARD_GROUPS.includes(value as BoardGroup)
}

/** `attention` columns are tinted (they need someone to act); `muted` ones are done. */
export type ColumnTone = 'attention' | 'default' | 'muted'

export interface BoardColumn {
  /** Stable across renders and filters: 'unassigned', 'person:priyashah', 'goal-0'… */
  id: string
  title: string
  description: string
  tone: ColumnTone
  /** Sorted; the column shows the first few. */
  issues: Issue[]
  /** One line shown when the column has no issues. */
  empty: string
  /** Set on a person's column, for the avatar in its header. */
  person?: Person
  /** Set on a goal's column, for the numbered bubble in its header. */
  goalIndex?: number
}

/** What a card repeats from its column is hidden: a status column needs no Stalled badge. */
export interface CardOptions {
  showStatusBadges: boolean
  showGoal: boolean
}

export function cardOptionsFor(group: BoardGroup): CardOptions {
  return { showStatusBadges: group !== 'status', showGoal: group !== 'goal' }
}

export interface BoardInput {
  open: Issue[]
  /** Issues closed this week; only the status board shows them. */
  closedThisWeek: Issue[]
  goals: Goal[]
  group: BoardGroup
  hasInsights: boolean
}

/** Goal grouping needs AI insights; without them the board groups by status. */
export function effectiveGroup(group: BoardGroup, hasInsights: boolean): BoardGroup {
  return group === 'goal' && !hasInsights ? 'status' : group
}

const goalLinked = (issue: Issue) => (issue.insight?.goalIndex != null ? 1 : 0)
const newest = (iso: string | null) => (iso ? Date.parse(iso) : 0)

/** Goal-linked issues first (when there are insights), then newest activity first. */
export function sortForColumn(issues: Issue[], hasInsights: boolean): Issue[] {
  return [...issues].sort(
    (a, b) => (hasInsights ? goalLinked(b) - goalLinked(a) : 0) || newest(b.updatedAt) - newest(a.updatedAt),
  )
}

function statusColumns({ open, closedThisWeek, hasInsights }: BoardInput): BoardColumn[] {
  const unassigned: Issue[] = []
  const stalled: Issue[] = []
  const review: Issue[] = []
  const progress: Issue[] = []

  // First matching rule wins, in this order.
  for (const issue of open) {
    if (isUnassigned(issue)) unassigned.push(issue)
    else if (issue.isStalled) stalled.push(issue)
    else if (hasInsights && issue.insight?.hasOpenPr) review.push(issue)
    else progress.push(issue)
  }

  const columns: BoardColumn[] = [
    {
      id: 'unassigned',
      title: 'Needs an owner',
      description: hasInsights ? 'Open and unassigned. Goal issues first.' : 'Open and unassigned.',
      tone: 'attention',
      issues: sortForColumn(unassigned, hasInsights),
      empty: 'Every open issue has an owner.',
    },
    {
      id: 'stalled',
      title: 'Stalled',
      description: `Assigned, but no activity for ${STALLED_AFTER_DAYS}+ days.`,
      tone: 'attention',
      issues: sortForColumn(stalled, hasInsights),
      empty: 'Nothing stalled.',
    },
    { id: 'progress', title: 'In progress', description: 'Assigned and moving.', tone: 'default', issues: sortForColumn(progress, hasInsights), empty: 'Nothing in progress.' },
  ]
  if (hasInsights) {
    columns.push({ id: 'review', title: 'In review', description: 'Has an open pull request.', tone: 'default', issues: sortForColumn(review, hasInsights), empty: 'No open pull requests.' })
  }
  columns.push({
    id: 'closed',
    title: 'Closed this week',
    description: 'Done since Monday.',
    tone: 'muted',
    issues: [...closedThisWeek].sort((a, b) => newest(b.closedAt) - newest(a.closedAt)),
    empty: 'Nothing closed yet this week.',
  })
  return columns
}

function plural(n: number, word: string): string {
  return `${n} ${word}`
}

function personColumns({ open, hasInsights }: BoardInput): BoardColumn[] {
  const byLogin = new Map<string, { person: Person; issues: Issue[] }>()
  const unassigned: Issue[] = []
  for (const issue of open) {
    if (isUnassigned(issue)) unassigned.push(issue)
    // An issue with two assignees shows in both people's columns.
    for (const person of issue.assignees) {
      const entry = byLogin.get(person.login) ?? { person, issues: [] }
      entry.issues.push(issue)
      byLogin.set(person.login, entry)
    }
  }

  const people = [...byLogin.values()].sort(
    (a, b) => b.issues.length - a.issues.length || a.person.login.localeCompare(b.person.login),
  )

  return [
    {
      id: 'unassigned',
      title: 'Needs an owner',
      description: plural(unassigned.length, 'open'),
      tone: 'attention' as const,
      issues: sortForColumn(unassigned, hasInsights),
      empty: 'Every open issue has an owner.',
    },
    ...people.map(({ person, issues }) => {
      const stalled = issues.filter((i) => i.isStalled).length
      const review = hasInsights ? issues.filter((i) => i.insight?.hasOpenPr).length : 0
      const parts = [plural(issues.length, 'open')]
      if (stalled) parts.push(plural(stalled, 'stalled'))
      if (review) parts.push(plural(review, 'in review'))
      return {
        id: `person:${person.login}`,
        title: person.name,
        description: parts.join(' · '),
        tone: 'default' as const,
        issues: sortForColumn(issues, hasInsights),
        empty: 'Nothing open.',
        person,
      }
    }),
  ]
}

function goalColumns({ open, goals, hasInsights }: BoardInput): BoardColumn[] {
  const columns: BoardColumn[] = goals.map((goal, goalIndex) => {
    const meta = [goal.target ? `Target: ${goal.target}` : null, goal.dueDate ? formatDueDate(goal.dueDate) : null]
    return {
      id: `goal-${goalIndex}`,
      title: goal.goal,
      description: meta.filter(Boolean).join(' · ') || 'No target set.',
      tone: 'default',
      issues: sortForColumn(
        open.filter((i) => i.insight?.goalIndex === goalIndex),
        hasInsights,
      ),
      empty: 'No open issues for this goal yet.',
      goalIndex,
    }
  })
  columns.push({
    id: 'no-goal',
    title: 'Not tied to a goal',
    description: 'Everything else that is open.',
    tone: 'muted',
    issues: sortForColumn(
      open.filter((i) => i.insight?.goalIndex == null || i.insight.goalIndex >= goals.length),
      hasInsights,
    ),
    empty: 'Every open issue is tied to a goal.',
  })
  return columns
}

/** The board's columns for one grouping. */
export function buildBoard(input: BoardInput): BoardColumn[] {
  switch (effectiveGroup(input.group, input.hasInsights)) {
    case 'person':
      return personColumns(input)
    case 'goal':
      return goalColumns(input)
    case 'status':
      return statusColumns(input)
  }
}
