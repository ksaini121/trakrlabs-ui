/**
 * TODO(api): goals, AI insights and linked issues have no endpoints yet.
 *
 * This adapter keeps those parts of the product usable in the meantime. Goals
 * live in memory for the browser tab (the UI says "Preview: not saved"). The
 * design's sample insights and links show for the demo project, and sample
 * links show on other projects, marked as sample data.
 */
import { previousWeek, toISODate, weekContaining } from '@/lib/dates'
import type { Bundle, Goal, GoalVersion, GoalsState, IssueInsights, LinkSet, LinkedIssues, Person } from '@/types/domain'
import { NORTHWIND_ID } from './seed'

const MIN = 60_000

const person = (login: string, name: string): Person => ({ id: `gh:${login}`, login, name, avatarUrl: null })

const people = {
  alex: person('alexm', 'Alex Morgan'),
  priya: person('priyashah', 'Priya Shah'),
  dan: person('dokafor', 'Dan Okafor'),
  mei: person('meilin', 'Mei Lin'),
  sam: person('samruiz', 'Sam Ruiz'),
}

// ── Goals ─────────────────────────────────────────────────────────────────

const thisWeek = () => weekContaining(new Date())
/** A date inside this week, `offset` days after Monday. */
const weekDay = (offset: number) => {
  const d = new Date(`${thisWeek().start}T00:00:00`)
  d.setDate(d.getDate() + offset)
  return toISODate(d)
}
const at = (week: { start: string }, dayOffset: number, hh: number, mm: number) => {
  const d = new Date(`${week.start}T00:00:00`)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hh, mm, 0, 0)
  return new Date(Math.min(d.getTime(), Date.now() - 5 * MIN)).toISOString()
}

function seedGoalHistory(): Record<string, GoalVersion[]> {
  const week = thisWeek()
  const prev = previousWeek(week)
  return {
    [NORTHWIND_ID]: [
      {
        id: 'gv-3',
        week,
        goals: [
          { goal: 'Onboard 3 pilot customers', target: '3 pilot users onboarded', dueDate: weekDay(4) },
          { goal: 'Ship invoice export', target: 'CSV and PDF export live on all plans', dueDate: weekDay(3) },
          { goal: 'Reduce sign-up drop-off', target: 'Under 30% drop-off at step 2', dueDate: null },
        ],
        editedBy: people.priya,
        editedAt: at(week, 0, 11, 30),
      },
      {
        id: 'gv-2',
        week,
        goals: [
          { goal: 'Onboard 2 pilot customers', target: null, dueDate: weekDay(4) },
          { goal: 'Ship invoice export', target: 'CSV and PDF export live on all plans', dueDate: weekDay(3) },
        ],
        editedBy: people.alex,
        editedAt: at(week, 0, 9, 5),
      },
      {
        id: 'gv-prev',
        week: prev,
        goals: [
          { goal: 'Prepare pilot onboarding', target: null, dueDate: null },
          { goal: 'Start invoice export', target: 'CSV export in staging', dueDate: null },
          { goal: 'Measure the sign-up funnel', target: null, dueDate: null },
        ],
        editedBy: people.dan,
        editedAt: at(prev, 0, 10, 12),
      },
    ],
  }
}

const goalHistory = seedGoalHistory()

function goalsState(projectId: string): GoalsState {
  const week = thisWeek()
  const history = goalHistory[projectId] ?? []
  const current = history.find((v) => v.week.start === week.start) ?? null
  return structuredClone({ week, current, history })
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const previewGoals = {
  get: async (projectId: string): Promise<GoalsState> => {
    await wait(250)
    return goalsState(projectId)
  },

  save: async (projectId: string, goals: Goal[], editor: Person): Promise<GoalsState> => {
    await wait(400)
    const cleaned = goals
      .map((g) => ({ goal: g.goal.trim(), target: g.target?.trim() || null, dueDate: g.dueDate || null }))
      .filter((g) => g.goal)
    if (!cleaned.length) throw new Error('Add at least one goal.')
    const version: GoalVersion = {
      id: `gv-${Date.now().toString(36)}`,
      week: thisWeek(),
      goals: cleaned,
      editedBy: editor,
      editedAt: new Date().toISOString(),
    }
    goalHistory[projectId] = [version, ...(goalHistory[projectId] ?? [])]
    return goalsState(projectId)
  },

  restore: async (projectId: string, versionId: string, editor: Person): Promise<GoalsState> => {
    const version = (goalHistory[projectId] ?? []).find((v) => v.id === versionId)
    if (!version) throw new Error('That version no longer exists.')
    return previewGoals.save(projectId, version.goals, editor)
  },
}

// ── Insights for the weekly list ──────────────────────────────────────────

const designInsights: IssueInsights = {
  214: { goalIndex: 0, reason: 'Pilot customers sign in with SSO, and invites currently break for them.', hasOpenPr: false, needsDetail: false },
  198: { goalIndex: 0, reason: 'Pilots need sample data to try the product in their first session.', hasOpenPr: false, needsDetail: false },
  231: { goalIndex: 1, reason: 'Blocks export for accounts with more than 500 line items.', hasOpenPr: false, needsDetail: false },
  243: { goalIndex: 2, reason: 'Needed to measure drop-off against this week’s target.', hasOpenPr: false, needsDetail: false },
  205: { goalIndex: 0, reason: 'The first thing a pilot admin sees after signing up.', hasOpenPr: true, needsDetail: false },
  209: { goalIndex: 0, reason: 'Each pilot brings 10–20 users; inviting one by one is slow.', hasOpenPr: false, needsDetail: false },
  187: { goalIndex: 0, reason: 'Probably affects pilots, but the issue has no steps or details to match on.', hasOpenPr: false, needsDetail: true },
  222: { goalIndex: 1, reason: 'PDF is half of this week’s export target.', hasOpenPr: true, needsDetail: false },
  224: { goalIndex: 1, reason: 'Finance teams asked for tax fields before they can use the export.', hasOpenPr: false, needsDetail: false },
  226: { goalIndex: 1, reason: 'This is where people will look for export first.', hasOpenPr: true, needsDetail: false },
  240: { goalIndex: 2, reason: 'People who verify later hit an expired link and leave at step 2.', hasOpenPr: false, needsDetail: false },
  236: { goalIndex: 2, reason: 'Step 2 is where most people drop off, and this field is skipped most.', hasOpenPr: false, needsDetail: false },
}

/** Sample insights for the demo project only; real repos get none until the API ranks them. */
export async function previewInsights(projectId: string): Promise<IssueInsights> {
  await wait(200)
  return projectId === NORTHWIND_ID ? structuredClone(designInsights) : {}
}

// ── Linked issues ─────────────────────────────────────────────────────────

export async function previewLinkedIssues(repoUrl: string): Promise<LinkedIssues> {
  await wait(350)
  const ref = (number: number, title: string) => ({ number, title, url: `${repoUrl}/issues/${number}` })
  const acrossDevelopers: LinkSet[] = [
    { id: 'l1', type: 'sameRootCause', reason: 'Both come from how sign-in tokens expire in the auth service.', issues: [{ ...ref(240, 'Email verification link expires too fast'), assignee: people.sam }, { ...ref(251, 'Magic-link sign-in fails on Safari'), assignee: people.mei }] },
    { id: 'l2', type: 'duplicate', reason: '#187 describes the same admin onboarding gap that #205 is fixing.', issues: [{ ...ref(187, 'Onboarding is confusing'), assignee: people.sam }, { ...ref(205, 'Onboarding checklist for workspace admins'), assignee: people.priya }] },
    { id: 'l3', type: 'blocks', reason: '#226 needs the final CSV columns from #224 before it can ship.', issues: [{ ...ref(224, 'CSV export: include tax columns'), assignee: people.dan }, { ...ref(226, 'Add export option to the invoice list page'), assignee: people.mei }] },
    { id: 'l4', type: 'sameArea', reason: 'Both change how invoices are rendered.', issues: [{ ...ref(222, 'PDF invoice template with company logo'), assignee: people.priya }, { ...ref(233, 'Invoice numbers reset per workspace'), assignee: people.dan }] },
  ]
  const bundles: Bundle[] = [
    { id: 'b1', assignee: people.priya, reason: 'Both touch the welcome email template, so one review covers them.', issues: [{ ...ref(247, 'Fix typo in the welcome email'), size: 'S' }, { ...ref(249, 'Update welcome email footer links'), size: 'S' }] },
    { id: 'b2', assignee: people.dan, reason: 'Same export file and the same tests.', issues: [{ ...ref(224, 'CSV export: include tax columns'), size: 'M' }, { ...ref(252, 'Rename “Amount” column to “Total”'), size: 'S' }] },
  ]
  return { acrossDevelopers, bundles }
}
