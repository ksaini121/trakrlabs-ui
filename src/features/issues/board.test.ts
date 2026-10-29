import { describe, expect, it } from 'vitest'
import type { Goal, Issue, IssueInsight, Person } from '@/types/domain'
import { buildBoard, cardOptionsFor, effectiveGroup, type BoardInput } from './board'
import { applyFilters, DEFAULT_FILTERS } from './filters'

const person = (login: string): Person => ({ id: `gh:${login}`, login, name: login, avatarUrl: null })
const insight = (goalIndex: number | null, hasOpenPr = false): IssueInsight => ({ goalIndex, reason: 'why', hasOpenPr, needsDetail: false })

let n = 0
function issue(overrides: Partial<Issue> = {}): Issue {
  n += 1
  return {
    id: `i${n}`,
    projectId: 'p1',
    number: n,
    title: `Issue ${n}`,
    body: null,
    state: 'open',
    url: `https://github.com/o/r/issues/${n}`,
    labels: [],
    assignees: [person('dan')],
    authorLogin: null,
    milestone: null,
    commentsCount: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    closedAt: null,
    syncedAt: '2026-10-26T00:00:00Z',
    isStalled: false,
    ...overrides,
  }
}

const goals: Goal[] = [
  { goal: 'Onboard pilots', target: '3 pilots', dueDate: null },
  { goal: 'Ship export', target: null, dueDate: null },
]

const board = (input: Partial<BoardInput>) =>
  buildBoard({ open: [], closedThisWeek: [], goals, group: 'status', hasInsights: false, ...input })

const ids = (issues: Issue[]) => issues.map((i) => i.id)
const column = (columns: ReturnType<typeof buildBoard>, id: string) => columns.find((c) => c.id === id)

describe('grouped by status', () => {
  it('puts each issue in the first matching column', () => {
    const unassigned = issue({ assignees: [] })
    const stalled = issue({ isStalled: true })
    const moving = issue()
    const closed = issue({ state: 'closed', closedAt: '2026-10-27T09:00:00Z' })
    const columns = board({ open: [unassigned, stalled, moving], closedThisWeek: [closed] })
    expect(columns.map((c) => c.id)).toEqual(['unassigned', 'stalled', 'progress', 'closed'])
    expect(ids(column(columns, 'unassigned')!.issues)).toEqual([unassigned.id])
    expect(ids(column(columns, 'stalled')!.issues)).toEqual([stalled.id])
    expect(ids(column(columns, 'progress')!.issues)).toEqual([moving.id])
    expect(ids(column(columns, 'closed')!.issues)).toEqual([closed.id])
  })

  it('an unassigned stalled issue only lands in Needs an owner', () => {
    const both = issue({ assignees: [], isStalled: true })
    const columns = board({ open: [both] })
    expect(column(columns, 'unassigned')!.issues).toHaveLength(1)
    expect(column(columns, 'stalled')!.issues).toHaveLength(0)
  })

  it('has In review only with insights, for issues with an open PR', () => {
    const withPr = issue({ insight: insight(0, true) })
    expect(column(board({ open: [withPr] }), 'review')).toBeUndefined()
    const columns = board({ open: [withPr], hasInsights: true })
    expect(ids(column(columns, 'review')!.issues)).toEqual([withPr.id])
    expect(column(columns, 'progress')!.issues).toHaveLength(0)
  })

  it('keeps empty columns so the board keeps its shape', () => {
    expect(board({}).map((c) => c.issues.length)).toEqual([0, 0, 0, 0])
  })

  it('orders goal-linked issues first, then newest activity', () => {
    const old = issue({ assignees: [], updatedAt: '2026-10-01T00:00:00Z' })
    const recent = issue({ assignees: [], updatedAt: '2026-10-25T00:00:00Z' })
    const oldGoal = issue({ assignees: [], updatedAt: '2026-09-01T00:00:00Z', insight: insight(1) })
    expect(ids(board({ open: [old, recent] })[0].issues)).toEqual([recent.id, old.id])
    expect(ids(board({ open: [old, recent, oldGoal], hasInsights: true })[0].issues)).toEqual([oldGoal.id, recent.id, old.id])
  })
})

describe('grouped by person', () => {
  it('starts with Needs an owner, then people by how much they have open', () => {
    const a = issue({ assignees: [person('mei')] })
    const b = issue({ assignees: [person('sam')] })
    const c = issue({ assignees: [person('sam')], isStalled: true })
    const d = issue({ assignees: [] })
    const columns = board({ open: [a, b, c, d], group: 'person' })
    expect(columns.map((col) => col.id)).toEqual(['unassigned', 'person:sam', 'person:mei'])
    expect(columns[1].description).toBe('2 open · 1 stalled')
    expect(columns[1].person?.login).toBe('sam')
  })

  it('shows an issue with two assignees under each of them', () => {
    const shared = issue({ assignees: [person('mei'), person('dan')] })
    const columns = board({ open: [shared], group: 'person' })
    expect(ids(column(columns, 'person:mei')!.issues)).toEqual([shared.id])
    expect(ids(column(columns, 'person:dan')!.issues)).toEqual([shared.id])
  })

  it('leaves closed issues out', () => {
    const closed = issue({ state: 'closed', closedAt: '2026-10-27T09:00:00Z' })
    const columns = board({ closedThisWeek: [closed], group: 'person' })
    expect(columns.flatMap((c) => c.issues)).toHaveLength(0)
  })
})

describe('grouped by goal', () => {
  it('needs insights; without them the board groups by status', () => {
    expect(effectiveGroup('goal', false)).toBe('status')
    expect(board({ group: 'goal' }).map((c) => c.id)).toContain('unassigned')
  })

  it('has one column per goal, then Not tied to a goal', () => {
    const g0 = issue({ insight: insight(0) })
    const g1 = issue({ insight: insight(1) })
    const none = issue()
    const columns = board({ open: [g0, g1, none], group: 'goal', hasInsights: true })
    expect(columns.map((c) => c.id)).toEqual(['goal-0', 'goal-1', 'no-goal'])
    expect(columns[0].description).toBe('Target: 3 pilots')
    expect(ids(columns[2].issues)).toEqual([none.id])
  })
})

describe('with filters', () => {
  it('groups only what the filters leave', () => {
    const bug = issue({ assignees: [], labels: [{ name: 'bug', color: 'red' }] })
    const other = issue({ assignees: [] })
    const open = applyFilters([bug, other], { ...DEFAULT_FILTERS, label: 'bug' })
    expect(ids(board({ open })[0].issues)).toEqual([bug.id])
  })
})

describe('card options', () => {
  it('hides what the column already says', () => {
    expect(cardOptionsFor('status')).toEqual({ showStatusBadges: false, showGoal: true })
    expect(cardOptionsFor('goal')).toEqual({ showStatusBadges: true, showGoal: false })
    expect(cardOptionsFor('person')).toEqual({ showStatusBadges: true, showGoal: true })
  })
})
