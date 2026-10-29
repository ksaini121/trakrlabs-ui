import type { IssueStateParam } from './dto'

/**
 * Every TanStack Query key in the app. Nothing builds keys inline.
 *
 * Lists and details live on separate branches, so invalidating the project list
 * never refetches every open project. Invalidate a project's members or issues
 * with their own keys; use `exact: true` for the detail key itself.
 */
export const queryKeys = {
  session: ['session'] as const,

  projects: {
    all: ['projects'] as const,
    list: () => ['projects', 'list'] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    members: (projectId: string) => ['projects', 'detail', projectId, 'members'] as const,
    /** All issue lists of one project (any state), for invalidation after a sync. */
    issuesAll: (projectId: string) => ['projects', 'detail', projectId, 'issues'] as const,
    issues: (projectId: string, state: IssueStateParam) => ['projects', 'detail', projectId, 'issues', state] as const,
    // TODO(api): these three read the mock adapter until their endpoints exist.
    goals: (projectId: string) => ['projects', 'detail', projectId, 'goals'] as const,
    insights: (projectId: string) => ['projects', 'detail', projectId, 'insights'] as const,
    linked: (projectId: string) => ['projects', 'detail', projectId, 'linked'] as const,
  },

  issue: (issueId: string) => ['issues', issueId] as const,
}
