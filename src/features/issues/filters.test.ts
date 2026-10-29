import { describe, expect, it } from 'vitest'
import type { Goal, Issue, Person } from '@/types/domain'
import { applyFilters, assigneesIn, DEFAULT_FILTERS, groupIssues, statusOptions } from './filters'

const person = (login: string): Person => ({ id: `gh:${login}`, login, name: login, avatarUrl: null })

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
    updatedAt: `2026-10-${String(10 + n).padStart(2, '0')}T00:00:00Z`,
    closedAt: null,
    syncedAt: '2026-10-26T00:00:00Z',
    isStalled: false,
    ...overrides,
  }
}

const goals: Goal[] = [
  { goal: 'Onboard pilots', target: null, dueDate: null },
  { goal: 'Ship export', target: null, dueDate: null },
]

describe('without AI insights', () => {
  it('shows one list, newest activity first', () => {
    const a = issue({ updatedAt: '2026-10-01T00:00:00Z' })
    const b = issue({ updatedAt: '2026-10-20T00:00:00Z' })
    const groups = groupIssues([a, b], goals, DEFAULT_FILTERS, false)
    expect(groups).toHaveLength(1)
    expect(groups[0].kind).toBe('recent')
    expect(groups[0].issues.map((i) => i.id)).toEqual([b.id, a.id])
  })

  it('offers only the filters the API can answer', () => {
    expect(statusOptions(false).map((o) => o.value)).toEqual(['stalled', 'unassigned'])
    expect(statusOptions(true).map((o) => o.value)).toEqual(['openPr', 'stalled', 'unassigned', 'needsDetail'])
  })
})

describe('with AI insights', () => {
  const insight = (goalIndex: number | null) => ({ goalIndex, reason: 'why', hasOpenPr: false, needsDetail: false })

  it('groups by goal, pulls unassigned goal issues into Needs attention, and keeps the rest', () => {
    const unassigned = issue({ assignees: [], insight: insight(0) })
    const forGoal0 = issue({ insight: insight(0) })
    const forGoal1 = issue({ insight: insight(1) })
    const noGoal = issue({ assignees: [] })
    const groups = groupIssues([unassigned, forGoal0, forGoal1, noGoal], goals, DEFAULT_FILTERS, true)
    expect(groups.map((g) => g.kind)).toEqual(['attention', 'goal', 'goal', 'other'])
    expect(groups[0].issues).toEqual([unassigned])
    expect(groups[1].issues).toEqual([forGoal0])
    expect(groups[3].issues).toEqual([noGoal])
  })
})

describe('applyFilters', () => {
  it('matches any assignee, unassigned, labels, stalled and search by number', () => {
    const shared = issue({ assignees: [person('mei'), person('sam')] })
    const nobody = issue({ assignees: [] })
    const stalled = issue({ isStalled: true, labels: [{ name: 'bug', color: 'red' }] })
    const all = [shared, nobody, stalled]
    expect(applyFilters(all, { ...DEFAULT_FILTERS, assignee: 'sam' })).toEqual([shared])
    expect(applyFilters(all, { ...DEFAULT_FILTERS, assignee: 'none' })).toEqual([nobody])
    expect(applyFilters(all, { ...DEFAULT_FILTERS, status: 'stalled' })).toEqual([stalled])
    expect(applyFilters(all, { ...DEFAULT_FILTERS, label: 'bug' })).toEqual([stalled])
    expect(applyFilters(all, { ...DEFAULT_FILTERS, q: `#${nobody.number}` })).toContain(nobody)
  })

  it('lists each assignee once, by login', () => {
    const list = assigneesIn([issue({ assignees: [person('sam'), person('dan')] }), issue({ assignees: [person('dan')] })])
    expect(list.map((p) => p.login)).toEqual(['dan', 'sam'])
  })
})
