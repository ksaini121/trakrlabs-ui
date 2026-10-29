/**
 * Every value the app shows that the API doesn't return yet.
 *
 * Each export waits for one backend field or endpoint, named in its TODO(api).
 * Mappers import from here only; no placeholder values live anywhere else.
 * When the field ships: run `npm run api:types`, map the real field, delete the
 * export here, and let TypeScript point at anything left behind.
 * `npm run todo:api` lists them all.
 */
import type { IssueInsights, IssueLabel, Person } from '@/types/domain'
import { USE_MOCKS } from './client'

/** TODO(api): ProjectOut has no members. Cards and the dashboard hide the avatar stack while this is empty. */
export const PROJECT_MEMBERS_PLACEHOLDER: Person[] = []

/** TODO(api): ProjectOut has no last_synced_at. The dashboard derives it from the newest issue synced_at instead. */
export const PROJECT_LAST_SYNCED_PLACEHOLDER: string | null = null

/** TODO(api): ProjectOut has no open_issue_count. Not shown anywhere until it exists. */
export const PROJECT_OPEN_ISSUES_PLACEHOLDER: number | null = null

/** TODO(api): UserOut has no display name; show the GitHub login until it does. */
export function displayNamePlaceholder(login: string): string {
  return login
}

/**
 * TODO(api): IssueOut and MemberOut have no avatar URLs; GitHub serves one per login.
 * Mock logins aren't real people, so mock mode shows initials instead.
 */
export function githubAvatarPlaceholder(login: string): string | null {
  return USE_MOCKS ? null : `https://github.com/${encodeURIComponent(login)}.png?size=64`
}

/** TODO(api): IssueOut labels have no colours. A stable colour per label name from the Organic palette. */
const LABEL_COLOURS = [
  'var(--color-accent-500)',
  'var(--color-accent-2-500)',
  'var(--color-neutral-600)',
  'var(--color-accent-300)',
  'var(--color-accent-2-300)',
  'var(--color-neutral-400)',
] as const

export function labelPlaceholder(name: string): IssueLabel {
  const hash = [...name.toLowerCase()].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return { name, color: LABEL_COLOURS[hash % LABEL_COLOURS.length] }
}

/** TODO(api): no weekly-list endpoint. Issues have no AI reason, goal, Open PR or Needs detail until it exists. */
export const ISSUE_INSIGHTS_PLACEHOLDER: IssueInsights = {}

/** TODO(api): GET /issue has no total count, so the app pages until a short page, capped here. */
export const ISSUE_FETCH_CAP = 1000
