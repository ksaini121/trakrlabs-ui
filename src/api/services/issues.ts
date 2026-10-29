import type { Issue, SyncResult } from '@/types/domain'
import { http } from '../client'
import type { IssueOut, IssueStateParam, IssueSyncRequest, IssueSyncResponse } from '../dto'
import { toIssue } from '../mappers'
import { ISSUE_FETCH_CAP } from '../placeholders'

/** The API's maximum page size for GET /issue. */
export const ISSUE_PAGE_SIZE = 100

export const issuesService = {
  /**
   * GET /issue, every page: offset 0, 100, 200… until a page comes back short
   * or the cap is reached. The dashboard filters and sorts in memory.
   */
  listAll: async (projectId: string, state: IssueStateParam = 'open', signal?: AbortSignal): Promise<Issue[]> => {
    const all: IssueOut[] = []
    for (let offset = 0; offset < ISSUE_FETCH_CAP; offset += ISSUE_PAGE_SIZE) {
      if (signal?.aborted) break
      const page = await http<IssueOut[]>('GET', '/issue', {
        query: { project_id: projectId, state, limit: ISSUE_PAGE_SIZE, offset },
      })
      all.push(...page)
      if (page.length < ISSUE_PAGE_SIZE) break
    }
    const now = Date.now()
    return all.slice(0, ISSUE_FETCH_CAP).map((dto) => toIssue(dto, now))
  },

  /** GET /issue/{id} */
  get: async (issueId: string): Promise<Issue> => toIssue(await http<IssueOut>('GET', `/issue/${encodeURIComponent(issueId)}`)),

  /** POST /issue/sync: fetches the repo's issues from GitHub. Answers when done. */
  sync: async (projectId: string): Promise<SyncResult> => {
    const json: IssueSyncRequest = { project_id: projectId }
    const result = await http<IssueSyncResponse>('POST', '/issue/sync', { json })
    return { projectId: result.project_id, synced: result.synced }
  },
}
