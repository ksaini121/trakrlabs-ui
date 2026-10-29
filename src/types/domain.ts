/**
 * Domain model for Trakr v1: the app's own types.
 *
 * Components only ever see these. API responses are turned into them by
 * `src/api/mappers.ts`, so a backend rename touches one function. Dates are
 * ISO 8601 strings; formatting happens in the UI (see `lib/dates.ts`).
 */

export type ISODateTime = string
/** Calendar date without a time, e.g. "2026-10-30". */
export type ISODate = string

// ── People ────────────────────────────────────────────────────────────────

/**
 * Someone shown with an avatar. `id` is a Trakr user id when known, otherwise
 * `gh:<login>` for GitHub accounts we only know by login (issue assignees).
 */
export interface Person {
  id: string
  login: string
  /** Display name. The API has no name field yet, so this is the login for now. */
  name: string
  avatarUrl: string | null
}

/** The signed-in user. */
export interface SessionUser extends Person {
  githubId: number
  email: string | null
  /** Stored but not used yet: every project member can do everything in v1. */
  role: string
}

// ── Projects ──────────────────────────────────────────────────────────────

export interface RepoRef {
  owner: string
  name: string
  /** "owner/name" */
  fullName: string
  url: string
}

/** `creator` when the signed-in user created the project. */
export type ProjectRole = 'creator' | 'member'

export interface Project {
  id: string
  name: string
  description: string | null
  repo: RepoRef
  role: ProjectRole
  createdById: string
  /** Stored but not used yet. */
  adminId: string | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
  /** Placeholder (empty) until the API returns members with projects. */
  members: Person[]
  /** Placeholder (null) until the API returns it. */
  lastSyncedAt: ISODateTime | null
  /** Placeholder (null) until the API returns it. */
  openIssueCount: number | null
}

export interface ProjectsOverview {
  mine: Project[]
  shared: Project[]
}

export interface CreateProjectInput {
  name: string
  /** "owner/repo" */
  repo: string
  description?: string
}

// ── Members ───────────────────────────────────────────────────────────────

export interface Member {
  id: string
  email: string
  /** GitHub login, null until they sign in to Trakr. */
  login: string | null
  /** `invited` until they sign in with GitHub for the first time. */
  status: 'member' | 'invited'
  isYou: boolean
  isCreator: boolean
  invitedById: string | null
  addedAt: ISODateTime
}

// ── Weekly goals (mock adapter until the API has goals) ───────────────────

export interface Goal {
  goal: string
  target: string | null
  dueDate: ISODate | null
}

export const MAX_GOALS = 3

export interface Week {
  start: ISODate
  end: ISODate
}

export interface GoalVersion {
  id: string
  week: Week
  goals: Goal[]
  editedBy: Person
  editedAt: ISODateTime
}

export interface GoalsState {
  week: Week
  /** The latest version for the current week, or null if none has been saved. */
  current: GoalVersion | null
  /** Every saved version, newest first, across weeks. */
  history: GoalVersion[]
}

// ── Issues ────────────────────────────────────────────────────────────────

export interface IssueLabel {
  name: string
  /** Any CSS color. */
  color: string
}

/** What the AI adds to an issue. Absent until the weekly-list endpoint exists. */
export interface IssueInsight {
  /** Index into this week's goals, or null if it serves none. */
  goalIndex: number | null
  /** One line on why the issue matters for its goal. */
  reason: string
  hasOpenPr: boolean
  needsDetail: boolean
}

export interface Issue {
  id: string
  projectId: string
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  url: string
  labels: IssueLabel[]
  assignees: Person[]
  authorLogin: string | null
  milestone: string | null
  commentsCount: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
  closedAt: ISODateTime | null
  syncedAt: ISODateTime
  /** No GitHub activity for STALLED_AFTER_DAYS or more. */
  isStalled: boolean
  insight?: IssueInsight
}

/** Insights for a project's issues, keyed by issue number. */
export type IssueInsights = Record<number, IssueInsight>

export interface SyncResult {
  projectId: string
  synced: number
}

// ── Linked issues (mock adapter until the API has them) ───────────────────

export type LinkType = 'duplicate' | 'sameRootCause' | 'blocks' | 'sameArea'

export interface IssueRef {
  number: number
  title: string
  url: string
}

export interface LinkSet {
  id: string
  type: LinkType
  reason: string
  issues: Array<IssueRef & { assignee: Person }>
}

export type IssueSize = 'S' | 'M' | 'L'

export interface Bundle {
  id: string
  assignee: Person
  reason: string
  issues: Array<IssueRef & { size: IssueSize }>
}

export interface LinkedIssues {
  acrossDevelopers: LinkSet[]
  bundles: Bundle[]
}
