import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { insightsService, issuesService } from '@/api'
import type { IssueStateParam } from '@/api/dto'
import { lastSyncedAt, withInsights } from '@/api/mappers'
import { ISSUE_FETCH_CAP } from '@/api/placeholders'
import { queryKeys } from '@/api/queryKeys'
import { parseISODate, weekContaining } from '@/lib/dates'
import type { Issue } from '@/types/domain'

const ISSUES_STALE_MS = 2 * 60_000

/** GET /issue for one project, every page (see issuesService.listAll). */
export function useIssues(projectId: string, state: IssueStateParam = 'open') {
  return useQuery({
    queryKey: queryKeys.projects.issues(projectId, state),
    queryFn: ({ signal }) => issuesService.listAll(projectId, state, signal),
    staleTime: ISSUES_STALE_MS,
    enabled: Boolean(projectId),
  })
}

/** TODO(api): AI insights per issue. Empty against the real API until the weekly-list endpoint exists. */
export function useIssueInsights(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.insights(projectId),
    queryFn: () => insightsService.forIssues(projectId),
    staleTime: ISSUES_STALE_MS,
    enabled: Boolean(projectId),
  })
}

export interface WeeklyIssues {
  /** `undefined` while loading. */
  issues: Issue[] | undefined
  /** Newest synced_at across the issues: when the project last synced. */
  lastSyncedAt: string | null
  /** True once any issue has an AI insight; turns on goal groups and the AI-only filters. */
  hasInsights: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

/** The "This week" list: every open issue, with AI insights attached when there are any. */
export function useWeeklyIssues(projectId: string): WeeklyIssues {
  const issues = useIssues(projectId, 'open')
  const insights = useIssueInsights(projectId)
  const data = issues.data ? withInsights(issues.data, insights.data) : undefined
  return {
    issues: data,
    lastSyncedAt: issues.data ? lastSyncedAt(issues.data) : null,
    hasInsights: Boolean(insights.data && Object.keys(insights.data).length),
    isError: issues.isError,
    error: issues.error,
    refetch: () => void issues.refetch(),
  }
}

/** GET /issue/{id}, seeded from any issue list already in the cache. */
export function useIssue(projectId: string, issueId: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: queryKeys.issue(issueId),
    queryFn: () => issuesService.get(issueId),
    staleTime: ISSUES_STALE_MS,
    initialData: () =>
      queryClient.getQueryData<Issue[]>(queryKeys.projects.issues(projectId, 'open'))?.find((i) => i.id === issueId),
  })
}

/** TODO(api): linked issues and bundles. Sample data until the endpoint exists. */
export function useLinkedIssues(projectId: string, repoUrl: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.linked(projectId),
    queryFn: () => insightsService.linked(repoUrl ?? ''),
    staleTime: ISSUES_STALE_MS,
    enabled: Boolean(projectId && repoUrl),
  })
}

/** POST /issue/sync, then refetch that project's issue lists. */
export function useSyncIssues(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => issuesService.sync(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.issuesAll(projectId) }),
    meta: { handlesErrors: true },
  })
}

export interface ClosedThisWeek {
  issues: Issue[]
  /** True when the fetch stopped at the cap, so older closes this week may be missing. */
  capped: boolean
}

/**
 * Issues closed since Monday, for the board's "Closed this week" column.
 * Shares the `state=closed` cache entry, so Sync now refreshes it too.
 * TODO(api): a `closed_since` filter on GET /issue would make this one small request.
 */
export function useClosedThisWeek(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.projects.issues(projectId, 'closed'),
    queryFn: ({ signal }) => issuesService.listAll(projectId, 'closed', signal),
    staleTime: ISSUES_STALE_MS,
    enabled: Boolean(projectId) && enabled,
    select: (issues): ClosedThisWeek => {
      const weekStart = parseISODate(weekContaining(new Date()).start).getTime()
      return {
        issues: issues.filter((i) => i.closedAt !== null && Date.parse(i.closedAt) >= weekStart),
        capped: issues.length >= ISSUE_FETCH_CAP,
      }
    },
  })
}
