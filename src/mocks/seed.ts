/**
 * Seed data for the mock backend, as the API returns it (snake_case DTOs).
 * Mirrors the content of the Trakr POC design. Times are relative to "now".
 */
import type { IssueOut, MemberOut, ProjectOut, UserOut } from '@/api/dto'
import { parseISODate, weekContaining } from '@/lib/dates'

const MIN = 60_000
export const ago = (minutes: number): string => new Date(Date.now() - minutes * MIN).toISOString()

// ── Users ─────────────────────────────────────────────────────────────────

export const users = {
  alex: { id: 'u-alex', github_id: 1000, username: 'alexm', email: 'alex@northwind.io', avatar_url: null, user_role: 'user' },
  priya: { id: 'u-priya', github_id: 1001, username: 'priyashah', email: 'priya@northwind.io', avatar_url: null, user_role: 'user' },
} satisfies Record<string, UserOut>

/** The signed-in user in mock mode. */
export const me: UserOut = users.alex

// ── Projects ──────────────────────────────────────────────────────────────

export const NORTHWIND_ID = 'p-northwind'
export const MARKETING_ID = 'p-marketing'
export const BILLING_ID = 'p-billing'
/** Answers 403, to show the no-access screen: /projects/p-no-access */
export const NO_ACCESS_ID = 'p-no-access'

const project = (id: string, title: string, repo: string, createdBy: string, minutesAgo: number): ProjectOut => ({
  id,
  title,
  description: null,
  github_repo_name: repo,
  project_admin_id: createdBy,
  created_by: createdBy,
  created_at: ago(minutesAgo),
  updated_at: ago(minutesAgo),
})

export function seedProjects(): ProjectOut[] {
  return [
    project(NORTHWIND_ID, 'Northwind app', 'northwind/app', users.alex.id, 40 * 24 * 60),
    project(MARKETING_ID, 'Marketing site', 'northwind/website', users.alex.id, 20 * 24 * 60),
    project(BILLING_ID, 'Billing service', 'fernlabs/billing-api', users.priya.id, 60 * 24 * 60),
  ]
}

// ── Members ───────────────────────────────────────────────────────────────

const member = (id: string, email: string, username: string | null, invitedBy: string, minutesAgo: number): MemberOut => ({
  id,
  email,
  username,
  invited_by: invitedBy,
  created_at: ago(minutesAgo),
})

/** Members per project. The creator isn't listed, as the real API may not list them. */
export function seedMembers(): Record<string, MemberOut[]> {
  const alex = users.alex.id
  return {
    [NORTHWIND_ID]: [
      member('m-priya', 'priya@northwind.io', 'priyashah', alex, 39 * 24 * 60),
      member('m-dan', 'dan@northwind.io', 'dokafor', alex, 39 * 24 * 60),
      member('m-mei', 'mei@northwind.io', 'meilin', alex, 30 * 24 * 60),
      member('m-sam', 'sam@northwind.io', 'samruiz', alex, 21 * 24 * 60),
      member('m-chris', 'chris@northwind.io', null, alex, 2 * 24 * 60),
    ],
    [MARKETING_ID]: [member('m-mei-2', 'mei@northwind.io', 'meilin', alex, 19 * 24 * 60)],
    [BILLING_ID]: [
      member('m-alex-3', 'alex@northwind.io', 'alexm', users.priya.id, 50 * 24 * 60),
      member('m-dan-3', 'dan@northwind.io', 'dokafor', users.priya.id, 50 * 24 * 60),
    ],
  }
}

// ── Issues ────────────────────────────────────────────────────────────────

interface IssueSeed {
  number: number
  title: string
  assignees: string[]
  labels: string[]
  minutesAgo: number
}

/** The issues from the design, in the order the AI ranks them (see preview.ts). */
export const designIssues: IssueSeed[] = [
  { number: 214, title: 'SSO login fails for workspace invites', assignees: [], labels: ['bug', 'auth'], minutesAgo: 180 },
  { number: 198, title: 'Seed demo data for new workspaces', assignees: ['dokafor'], labels: ['onboarding'], minutesAgo: 9 * 24 * 60 },
  { number: 231, title: 'Export button times out on large invoices', assignees: [], labels: ['bug', 'billing'], minutesAgo: 1440 },
  { number: 243, title: 'Track sign-up step completion events', assignees: ['priyashah'], labels: ['ux'], minutesAgo: 12 * 24 * 60 },
  { number: 205, title: 'Onboarding checklist for workspace admins', assignees: ['priyashah'], labels: ['onboarding', 'enhancement'], minutesAgo: 120 },
  { number: 209, title: 'Bulk invite teammates from CSV', assignees: ['meilin'], labels: ['enhancement'], minutesAgo: 1500 },
  { number: 187, title: 'Onboarding is confusing', assignees: ['samruiz'], labels: ['onboarding'], minutesAgo: 4 * 24 * 60 },
  { number: 222, title: 'PDF invoice template with company logo', assignees: ['priyashah'], labels: ['billing'], minutesAgo: 40 },
  { number: 224, title: 'CSV export: include tax columns', assignees: ['dokafor'], labels: ['billing'], minutesAgo: 300 },
  { number: 226, title: 'Add export option to the invoice list page', assignees: ['meilin', 'dokafor'], labels: ['billing', 'ux'], minutesAgo: 20 },
  { number: 240, title: 'Email verification link expires too fast', assignees: ['samruiz'], labels: ['bug', 'auth'], minutesAgo: 360 },
  { number: 236, title: 'Make company size optional on step 2', assignees: ['alexm'], labels: ['ux'], minutesAgo: 1600 },
]

const AREAS = ['Settings page', 'Invoice list', 'Team page', 'Search', 'Notifications', 'API client', 'Dashboard', 'Billing emails', 'Audit log', 'Sign-up form', 'Webhooks', 'Mobile layout']
const PROBLEMS = ['loads slowly with many rows', 'shows the wrong timezone', 'needs empty state copy', 'breaks on narrow screens', 'should remember the last filter', 'throws on missing data', 'needs keyboard shortcuts', 'has outdated help links', 'double-submits on slow networks', 'needs better error messages', 'should support dark mode', 'is missing loading states']
const LOGINS = ['priyashah', 'dokafor', 'meilin', 'samruiz', 'alexm']
const LABELS = ['bug', 'enhancement', 'ux', 'billing', 'auth', 'onboarding', 'performance']

/** Plain issues around the design ones, so lists page past 100 like a real repo. */
export function fillerIssues(count: number, firstNumber: number, seed = 1): IssueSeed[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i * 7 + seed
    return {
      number: firstNumber + i,
      // Every area × problem pair once before any title repeats.
      title: `${AREAS[(i + seed) % AREAS.length]} ${PROBLEMS[Math.floor(i / AREAS.length) % PROBLEMS.length]}`,
      assignees: n % 4 === 0 ? [] : [LOGINS[n % LOGINS.length]],
      labels: [LABELS[n % LABELS.length], ...(n % 3 === 0 ? [LABELS[(n + 2) % LABELS.length]] : [])],
      minutesAgo: ((n * 977) % (21 * 24 * 60)) + 30,
    }
  })
}

let issueSeq = 0

export function toIssueOut(seed: IssueSeed, projectId: string, repo: string, syncedAt: string): IssueOut {
  issueSeq += 1
  return {
    id: `i-${projectId}-${seed.number}-${issueSeq}`,
    project_id: projectId,
    number: seed.number,
    title: seed.title,
    body: null,
    state: 'open',
    html_url: `https://github.com/${repo}/issues/${seed.number}`,
    author_login: 'alexm',
    assignees: seed.assignees,
    labels: seed.labels,
    milestone: null,
    comments_count: seed.number % 6,
    github_created_at: ago(seed.minutesAgo + 3 * 24 * 60),
    github_updated_at: ago(seed.minutesAgo),
    github_closed_at: null,
    synced_at: syncedAt,
  }
}

/**
 * Issues closed recently, for the board's "Closed this week" column.
 * `closedMinutesAgo` is clamped to this week, so they always land in it,
 * except the ones marked `lastMonth`.
 */
const closedSeeds: Array<IssueSeed & { closedMinutesAgo: number; lastMonth?: boolean }> = [
  { number: 230, title: 'Remember the last workspace on sign-in', assignees: ['samruiz'], labels: ['enhancement'], minutesAgo: 120, closedMinutesAgo: 120 },
  { number: 219, title: 'Invoice PDF uses the wrong currency symbol', assignees: ['dokafor'], labels: ['bug', 'billing'], minutesAgo: 1500, closedMinutesAgo: 1500 },
  { number: 201, title: 'Trial banner overlaps the menu on mobile', assignees: ['meilin'], labels: ['bug', 'ux'], minutesAgo: 2400, closedMinutesAgo: 2400 },
  { number: 188, title: 'Old onboarding email still sends', assignees: ['priyashah'], labels: ['onboarding'], minutesAgo: 30 * 24 * 60, closedMinutesAgo: 30 * 24 * 60, lastMonth: true },
]

function closedIssues(projectId: string, repo: string, syncedAt: string): IssueOut[] {
  const weekStart = parseISODate(weekContaining(new Date()).start).getTime()
  return closedSeeds.map((seed) => {
    const closedAt = seed.lastMonth
      ? Date.now() - seed.closedMinutesAgo * MIN
      : Math.max(Date.now() - seed.closedMinutesAgo * MIN, weekStart + 60 * MIN)
    const closed = new Date(Math.min(closedAt, Date.now())).toISOString()
    return { ...toIssueOut(seed, projectId, repo, syncedAt), state: 'closed', github_updated_at: closed, github_closed_at: closed }
  })
}

/** Open issues already synced for the seeded projects. Northwind has 148, like the design. */
export function seedIssues(): IssueOut[] {
  const synced = ago(4)
  return [
    ...designIssues.map((s) => toIssueOut(s, NORTHWIND_ID, 'northwind/app', synced)),
    ...closedIssues(NORTHWIND_ID, 'northwind/app', synced),
    ...fillerIssues(136, 300).map((s) => toIssueOut(s, NORTHWIND_ID, 'northwind/app', synced)),
    ...fillerIssues(23, 40, 3).map((s) => toIssueOut(s, MARKETING_ID, 'northwind/website', ago(2 * 24 * 60 + 300))),
    ...fillerIssues(61, 500, 5).map((s) => toIssueOut(s, BILLING_ID, 'fernlabs/billing-api', ago(26 * 60))),
  ]
}

/** A stable issue count for a new repo, so the same repo always syncs the same number. */
export function issueCountFor(repo: string): number {
  return 20 + ([...repo].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 140)
}
