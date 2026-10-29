/**
 * API responses in, app types out. The only place that knows backend field names.
 */
import type { Issue, IssueInsights, Member, Person, Project, RepoRef, SessionUser } from '@/types/domain'
import type { IssueOut, MemberOut, ProjectOut, UserOut } from './dto'
import {
  displayNamePlaceholder,
  githubAvatarPlaceholder,
  labelPlaceholder,
  PROJECT_LAST_SYNCED_PLACEHOLDER,
  PROJECT_MEMBERS_PLACEHOLDER,
  PROJECT_OPEN_ISSUES_PLACEHOLDER,
} from './placeholders'

/** An issue with no GitHub activity for this many days counts as stalled. */
export const STALLED_AFTER_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

/** "owner/repo" → owner, name and GitHub URL. */
export function toRepo(fullName: string): RepoRef {
  const [owner = '', name = ''] = fullName.split('/')
  return { owner, name, fullName, url: `https://github.com/${owner}/${name}` }
}

export function toUser(dto: UserOut): SessionUser {
  return {
    id: dto.id,
    githubId: dto.github_id,
    login: dto.username,
    name: displayNamePlaceholder(dto.username),
    email: dto.email,
    avatarUrl: dto.avatar_url,
    role: dto.user_role,
  }
}

/** Someone we only know by GitHub login, e.g. an issue assignee. */
export function toGitHubPerson(login: string): Person {
  return { id: `gh:${login}`, login, name: login, avatarUrl: githubAvatarPlaceholder(login) }
}

export function toProject(dto: ProjectOut, meId: string | null): Project {
  return {
    id: dto.id,
    name: dto.title,
    description: dto.description,
    repo: toRepo(dto.github_repo_name),
    role: meId !== null && dto.created_by === meId ? 'creator' : 'member',
    createdById: dto.created_by,
    adminId: dto.project_admin_id,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    members: PROJECT_MEMBERS_PLACEHOLDER,
    lastSyncedAt: PROJECT_LAST_SYNCED_PLACEHOLDER,
    openIssueCount: PROJECT_OPEN_ISSUES_PLACEHOLDER,
  }
}

export interface MemberContext {
  me: Pick<SessionUser, 'id' | 'login' | 'email'> | null
  createdById: string
}

function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase())
}

export function toMember(dto: MemberOut, { me, createdById }: MemberContext): Member {
  const isYou = Boolean(me && ((dto.username !== null && dto.username === me.login) || sameEmail(dto.email, me.email)))
  return {
    id: dto.id,
    email: dto.email,
    login: dto.username,
    status: dto.username === null ? 'invited' : 'member',
    isYou,
    // MemberOut has no user id, so the creator is only recognisable when it's you.
    isCreator: isYou && me?.id === createdById,
    invitedById: dto.invited_by,
    addedAt: dto.created_at,
  }
}

/**
 * The member list as shown in the invite popup: you first, then everyone else
 * in the order they were added. If you created the project and the API doesn't
 * list you, you're added at the top as the creator.
 */
export function toMemberList(dtos: MemberOut[], context: MemberContext): Member[] {
  const members = dtos.map((dto) => toMember(dto, context))
  const { me, createdById } = context
  if (me && me.id === createdById && !members.some((m) => m.isYou)) {
    // TODO(api): confirm whether MemberOut includes the creator; drop this if it does.
    members.unshift({
      id: `creator:${me.id}`,
      email: me.email ?? '',
      login: me.login,
      status: 'member',
      isYou: true,
      isCreator: true,
      invitedById: null,
      addedAt: '',
    })
  }
  return members.sort((a, b) => Number(b.isYou) - Number(a.isYou))
}

export function toIssue(dto: IssueOut, now: number = Date.now()): Issue {
  return {
    id: dto.id,
    projectId: dto.project_id,
    number: dto.number,
    title: dto.title,
    body: dto.body,
    state: dto.state === 'closed' ? 'closed' : 'open',
    url: dto.html_url,
    labels: dto.labels.map(labelPlaceholder),
    assignees: dto.assignees.map(toGitHubPerson),
    authorLogin: dto.author_login,
    milestone: dto.milestone,
    commentsCount: dto.comments_count,
    createdAt: dto.github_created_at,
    updatedAt: dto.github_updated_at,
    closedAt: dto.github_closed_at,
    syncedAt: dto.synced_at,
    isStalled: dto.state !== 'closed' && now - Date.parse(dto.github_updated_at) >= STALLED_AFTER_DAYS * DAY_MS,
  }
}

/** Attaches AI insights (when there are any) to issues by number. */
export function withInsights(issues: Issue[], insights: IssueInsights | undefined): Issue[] {
  if (!insights || !Object.keys(insights).length) return issues
  return issues.map((issue) => (insights[issue.number] ? { ...issue, insight: insights[issue.number] } : issue))
}

/** The newest `synced_at` across a project's issues: when it last synced, until ProjectOut says so. */
export function lastSyncedAt(issues: Issue[]): string | null {
  let newest: string | null = null
  for (const issue of issues) if (!newest || issue.syncedAt > newest) newest = issue.syncedAt
  return newest
}
