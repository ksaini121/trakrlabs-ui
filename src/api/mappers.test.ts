import { describe, expect, it } from 'vitest'
import type { IssueOut, MemberOut, ProjectOut, UserOut } from './dto'
import { lastSyncedAt, STALLED_AFTER_DAYS, toIssue, toMember, toMemberList, toProject, toRepo, toUser, withInsights } from './mappers'

// Sample responses in the shape of the backend's OpenAPI spec.
const user: UserOut = {
  id: '6f1c1d2e-0000-4000-8000-000000000001',
  github_id: 583231,
  username: 'octocat',
  email: 'octo@example.com',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231',
  user_role: 'user',
}

const project: ProjectOut = {
  id: '6f1c1d2e-0000-4000-8000-0000000000aa',
  title: 'Northwind app',
  description: null,
  github_repo_name: 'northwind/app',
  project_admin_id: null,
  created_by: user.id,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
}

const now = Date.parse('2026-10-26T12:00:00Z')
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString()

const issue: IssueOut = {
  id: '6f1c1d2e-0000-4000-8000-0000000000bb',
  project_id: project.id,
  number: 214,
  title: 'SSO login fails for workspace invites',
  body: 'Steps…',
  state: 'open',
  html_url: 'https://github.com/northwind/app/issues/214',
  author_login: 'priyashah',
  assignees: ['dokafor', 'meilin'],
  labels: ['bug', 'auth'],
  milestone: null,
  comments_count: 3,
  github_created_at: daysAgo(20),
  github_updated_at: daysAgo(2),
  github_closed_at: null,
  synced_at: '2026-10-26T11:55:00Z',
}

describe('toUser', () => {
  it('maps the GitHub login and uses it as the display name until the API has one', () => {
    expect(toUser(user)).toEqual({
      id: user.id,
      githubId: 583231,
      login: 'octocat',
      name: 'octocat',
      email: 'octo@example.com',
      avatarUrl: user.avatar_url,
      role: 'user',
    })
  })
})

describe('toProject', () => {
  it('maps title to name and builds the repo link', () => {
    const mapped = toProject(project, user.id)
    expect(mapped.name).toBe('Northwind app')
    expect(mapped.repo).toEqual({ owner: 'northwind', name: 'app', fullName: 'northwind/app', url: 'https://github.com/northwind/app' })
    expect(mapped.createdById).toBe(user.id)
  })

  it('is "creator" only for the user who created it', () => {
    expect(toProject(project, user.id).role).toBe('creator')
    expect(toProject(project, 'someone-else').role).toBe('member')
    expect(toProject(project, null).role).toBe('member')
  })

  it('uses placeholders for fields the API does not return yet', () => {
    const mapped = toProject(project, user.id)
    expect(mapped.members).toEqual([])
    expect(mapped.lastSyncedAt).toBeNull()
    expect(mapped.openIssueCount).toBeNull()
  })
})

describe('toRepo', () => {
  it('handles dots and dashes in names', () => {
    expect(toRepo('my-org/app.web').url).toBe('https://github.com/my-org/app.web')
  })
})

describe('members', () => {
  const invited: MemberOut = { id: 'm1', email: 'dan@northwind.io', username: null, invited_by: user.id, created_at: daysAgo(1) }
  const joined: MemberOut = { id: 'm2', email: 'Mei@Northwind.io', username: 'meilin', invited_by: user.id, created_at: daysAgo(3) }
  const context = { me: { id: user.id, login: user.username, email: user.email }, createdById: user.id }

  it('is "invited" until the person signs in, then "member"', () => {
    expect(toMember(invited, context).status).toBe('invited')
    expect(toMember(joined, context).status).toBe('member')
  })

  it('recognises you by login or by email, ignoring case', () => {
    expect(toMember({ ...joined, username: 'octocat' }, context).isYou).toBe(true)
    expect(toMember({ ...invited, email: 'OCTO@example.com' }, context).isYou).toBe(true)
    expect(toMember(joined, context).isYou).toBe(false)
  })

  it('adds you at the top as creator when the API does not list the creator', () => {
    const list = toMemberList([invited, joined], context)
    expect(list).toHaveLength(3)
    expect(list[0]).toMatchObject({ isYou: true, isCreator: true, login: 'octocat', status: 'member' })
  })

  it('does not add the creator when you are not the creator', () => {
    const list = toMemberList([invited, joined], { ...context, createdById: 'someone-else' })
    expect(list.map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('does not duplicate you when the API lists you', () => {
    const list = toMemberList([invited, { ...joined, username: 'octocat' }], context)
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe('m2')
    expect(list[0].isCreator).toBe(true)
  })
})

describe('toIssue', () => {
  it('maps GitHub fields and builds assignees and labels', () => {
    const mapped = toIssue(issue, now)
    expect(mapped).toMatchObject({
      number: 214,
      url: issue.html_url,
      state: 'open',
      authorLogin: 'priyashah',
      commentsCount: 3,
      updatedAt: issue.github_updated_at,
      syncedAt: issue.synced_at,
      isStalled: false,
    })
    expect(mapped.assignees.map((p) => p.login)).toEqual(['dokafor', 'meilin'])
    expect(mapped.assignees[0]).toMatchObject({ id: 'gh:dokafor', login: 'dokafor' })
    expect(mapped.labels.map((l) => l.name)).toEqual(['bug', 'auth'])
    expect(mapped.insight).toBeUndefined()
  })

  it('gives each label name the same colour every time', () => {
    expect(toIssue(issue, now).labels[0].color).toBe(toIssue({ ...issue, labels: ['bug'] }, now).labels[0].color)
  })

  it(`marks open issues with no activity for ${STALLED_AFTER_DAYS}+ days as stalled`, () => {
    expect(toIssue({ ...issue, github_updated_at: daysAgo(STALLED_AFTER_DAYS) }, now).isStalled).toBe(true)
    expect(toIssue({ ...issue, github_updated_at: daysAgo(STALLED_AFTER_DAYS - 1) }, now).isStalled).toBe(false)
    expect(toIssue({ ...issue, state: 'closed', github_updated_at: daysAgo(30) }, now).isStalled).toBe(false)
  })

  it('attaches insights by issue number', () => {
    const insight = { goalIndex: 0, reason: 'Matters', hasOpenPr: true, needsDetail: false }
    const [withOne] = withInsights([toIssue(issue, now)], { 214: insight })
    expect(withOne.insight).toEqual(insight)
  })

  it('takes the newest synced_at as the project last-synced time', () => {
    const a = toIssue({ ...issue, synced_at: '2026-10-26T10:00:00Z' }, now)
    const b = toIssue({ ...issue, synced_at: '2026-10-26T11:00:00Z' }, now)
    expect(lastSyncedAt([a, b])).toBe('2026-10-26T11:00:00Z')
    expect(lastSyncedAt([])).toBeNull()
  })
})
