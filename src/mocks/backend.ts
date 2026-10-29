/**
 * In-memory stand-in for the FastAPI backend, used when VITE_USE_MOCKS=true.
 *
 * It answers the same paths with the same JSON shapes and status codes as the
 * real API, so the app's services, mappers and error handling all run exactly
 * as they do against FastAPI.
 *
 * Try the error states:
 *   - Create project with a repository containing "notfound" → 422 on the repository field
 *   - Create project with a repository containing "ratelimit" → the first sync fails with 429
 *   - Add a member whose email contains "fail", then remove them → 500, the row comes back
 *   - Open /projects/p-no-access → 403, the no-access screen
 */
import type { HttpRequest, HttpResponse } from '@/api/client'
import type { IssueOut, MemberOut, ProjectOut } from '@/api/dto'
import { issueCountFor, fillerIssues, me, NO_ACCESS_ID, seedIssues, seedMembers, seedProjects, toIssueOut } from './seed'

const SESSION_KEY = 'trakr.mock.session'
const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const db = {
  projects: seedProjects(),
  members: seedMembers(),
  issues: seedIssues(),
  seq: 0,
}

// ── Session ───────────────────────────────────────────────────────────────

function readStoredSession(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

let signedIn = readStoredSession()

export function setMockSession(value: boolean): void {
  signedIn = value
  try {
    if (value) globalThis.sessionStorage?.setItem(SESSION_KEY, '1')
    else globalThis.sessionStorage?.removeItem(SESSION_KEY)
  } catch {
    // Storage unavailable: the session lasts until reload.
  }
}

// ── Responses ─────────────────────────────────────────────────────────────

class HttpFailure extends Error {
  readonly status: number
  readonly body: unknown
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

const fail = (status: number, detail: unknown): never => {
  throw new HttpFailure(status, { detail })
}

const invalid = (field: string, msg: string, type = 'value_error'): never =>
  fail(422, [{ loc: ['body', field], msg, type }])

const ok = (body: unknown, status = 200): HttpResponse => ({ status, body: structuredClone(body) })

function requireUser() {
  if (!signedIn) fail(401, 'Not authenticated')
  return me
}

function isMember(project: ProjectOut): boolean {
  return (
    project.created_by === me.id ||
    (db.members[project.id] ?? []).some((m) => m.email.toLowerCase() === me.email?.toLowerCase())
  )
}

function findProject(projectId: string | undefined): ProjectOut {
  requireUser()
  if (projectId === NO_ACCESS_ID) fail(403, "You don't have access to this project.")
  const project = db.projects.find((p) => p.id === projectId)
  if (!project) return fail(404, 'Project not found')
  if (!isMember(project)) fail(403, "You don't have access to this project.")
  return project
}

function nextId(prefix: string): string {
  db.seq += 1
  return `${prefix}-${Date.now().toString(36)}${db.seq}`
}

function page<T>(items: T[], query: HttpRequest['query']): T[] {
  const limit = Math.min(Number(query?.limit ?? 100), 100)
  const offset = Number(query?.offset ?? 0)
  return items.slice(offset, offset + limit)
}

function body<T>(request: HttpRequest): Partial<T> {
  return (request.json ?? {}) as Partial<T>
}

// ── Routes ────────────────────────────────────────────────────────────────

type Handler = (request: HttpRequest, params: string[]) => HttpResponse
type Route = [HttpRequest['method'], RegExp, Handler]

const routes: Route[] = [
  ['GET', /^\/health$/, () => ok({ status: 'ok' })],

  // Auth. Signing in is a redirect to GitHub on the real backend; the mock
  // service calls this extra route instead (see services/auth.ts).
  ['POST', /^\/__mock\/sign-in$/, () => {
    setMockSession(true)
    return ok({ ok: true })
  }],
  ['GET', /^\/auth\/me$/, () => ok(requireUser())],
  ['POST', /^\/auth\/logout$/, () => {
    setMockSession(false)
    return ok({ ok: true })
  }],

  // Projects
  ['GET', /^\/project$/, (request) => {
    requireUser()
    const visible = db.projects.filter(isMember).sort((a, b) => b.created_at.localeCompare(a.created_at))
    return ok(page(visible, request.query))
  }],
  ['POST', /^\/project$/, (request) => {
    const user = requireUser()
    const input = body<ProjectOut>(request)
    const title = (input.title ?? '').trim()
    const repo = (input.github_repo_name ?? '').trim()
    if (!title) invalid('title', 'String should have at least 1 character', 'string_too_short')
    if (!REPO_PATTERN.test(repo)) invalid('github_repo_name', "String should match pattern '^[\\w.-]+/[\\w.-]+$'", 'string_pattern_mismatch')
    if (repo.includes('notfound')) invalid('github_repo_name', 'Repository not found, or Trakr has no access to it.')
    const now = new Date().toISOString()
    const created: ProjectOut = {
      id: nextId('p'),
      title,
      description: input.description ?? null,
      github_repo_name: repo,
      project_admin_id: input.project_admin_id ?? user.id,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    }
    db.projects.push(created)
    db.members[created.id] = []
    return ok(created, 201)
  }],
  ['GET', /^\/project\/([^/]+)$/, (_request, [id]) => ok(findProject(id))],
  ['PATCH', /^\/project\/([^/]+)$/, (request, [id]) => {
    const project = findProject(id)
    const input = body<ProjectOut>(request)
    if (input.github_repo_name !== undefined && !REPO_PATTERN.test(input.github_repo_name ?? '')) {
      invalid('github_repo_name', "String should match pattern '^[\\w.-]+/[\\w.-]+$'", 'string_pattern_mismatch')
    }
    Object.assign(project, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)), {
      updated_at: new Date().toISOString(),
    })
    return ok(project)
  }],
  ['DELETE', /^\/project\/([^/]+)$/, (_request, [id]) => {
    const project = findProject(id)
    db.projects = db.projects.filter((p) => p !== project)
    db.issues = db.issues.filter((i) => i.project_id !== project.id)
    delete db.members[project.id]
    return { status: 204, body: null }
  }],

  // Members
  ['GET', /^\/project\/([^/]+)\/member$/, (_request, [id]) => {
    const project = findProject(id)
    return ok(db.members[project.id] ?? [])
  }],
  ['POST', /^\/project\/([^/]+)\/member$/, (request, [id]) => {
    const project = findProject(id)
    const email = (body<MemberOut>(request).email ?? '').trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) invalid('email', 'value is not a valid email address: An email address must have an @-sign.')
    const list = (db.members[project.id] ??= [])
    if (list.some((m) => m.email === email) || email === me.email) fail(409, `${email} is already a member of this project.`)
    const added: MemberOut = { id: nextId('m'), email, username: null, invited_by: me.id, created_at: new Date().toISOString() }
    list.push(added)
    return ok(added, 201)
  }],
  ['DELETE', /^\/project\/([^/]+)\/member\/([^/]+)$/, (_request, [id, memberId]) => {
    const project = findProject(id)
    const list = db.members[project.id] ?? []
    const target = list.find((m) => m.id === memberId)
    if (!target) fail(404, 'Member not found')
    if (target?.email.includes('fail')) fail(500, 'Internal Server Error')
    db.members[project.id] = list.filter((m) => m.id !== memberId)
    return { status: 204, body: null }
  }],

  // Issues
  ['GET', /^\/issue$/, (request) => {
    const project = findProject(String(request.query?.project_id ?? ''))
    const state = String(request.query?.state ?? 'open')
    const issues = db.issues
      .filter((i) => i.project_id === project.id && (state === 'all' || i.state === state))
      .sort((a, b) => b.github_updated_at.localeCompare(a.github_updated_at))
    return ok(page(issues, request.query))
  }],
  ['POST', /^\/issue\/sync$/, (request) => {
    const project = findProject(body<{ project_id: string }>(request).project_id)
    if (project.github_repo_name.includes('ratelimit')) fail(429, 'GitHub rate limit reached. Try again in about 15 minutes.')
    const now = new Date().toISOString()
    let issues: IssueOut[] = db.issues.filter((i) => i.project_id === project.id)
    if (!issues.length) {
      // First sync of a new project: "fetch" its issues from GitHub.
      issues = fillerIssues(issueCountFor(project.github_repo_name), 1, project.github_repo_name.length).map((seed) =>
        toIssueOut(seed, project.id, project.github_repo_name, now),
      )
      db.issues.push(...issues)
    }
    for (const issue of issues) issue.synced_at = now
    return ok({ project_id: project.id, synced: issues.length })
  }],
  ['GET', /^\/issue\/([^/]+)$/, (_request, [id]) => {
    requireUser()
    const issue = db.issues.find((i) => i.id === id)
    if (!issue) return fail(404, 'Issue not found')
    findProject(issue.project_id)
    return ok(issue)
  }],
]

/** How long the mock takes to answer, so loading states show. Sync takes longer, like GitHub. */
function latency(request: HttpRequest): number {
  if (typeof window === 'undefined') return 0
  if (request.path === '/issue/sync') return 1800
  if (request.path === '/__mock/sign-in') return 900
  return request.method === 'GET' ? 300 : 500
}

/** Handles one request like FastAPI would. */
export function handleMockRequest(request: HttpRequest): HttpResponse {
  for (const [method, pattern, handler] of routes) {
    const match = request.method === method ? pattern.exec(request.path) : null
    if (!match) continue
    try {
      return handler(request, match.slice(1).map(decodeURIComponent))
    } catch (error) {
      if (error instanceof HttpFailure) return { status: error.status, body: error.body }
      return { status: 500, body: { detail: 'Internal Server Error' } }
    }
  }
  return { status: 404, body: { detail: 'Not Found' } }
}

/** The transport the HTTP client uses in mock mode. */
export function mockBackend(request: HttpRequest): Promise<HttpResponse> {
  return new Promise((resolve) => setTimeout(() => resolve(handleMockRequest(request)), latency(request)))
}
