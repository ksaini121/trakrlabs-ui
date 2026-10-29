/**
 * TODO(api): goals, AI insights and linked issues have no endpoints yet.
 * These services read the in-browser preview adapter; swap each body for an
 * `http(...)` call when its endpoint ships.
 */
import { previewGoals, previewInsights, previewLinkedIssues } from '@/mocks/preview'
import type { Goal, GoalsState, IssueInsights, LinkedIssues, Person } from '@/types/domain'
import { USE_MOCKS } from '../client'
import { ISSUE_INSIGHTS_PLACEHOLDER } from '../placeholders'

export const goalsService = {
  /** TODO(api): GET /project/{id}/goals */
  get: (projectId: string): Promise<GoalsState> => previewGoals.get(projectId),
  /** TODO(api): POST /project/{id}/goals */
  save: (projectId: string, goals: Goal[], editor: Person): Promise<GoalsState> => previewGoals.save(projectId, goals, editor),
  /** TODO(api): POST /project/{id}/goals/{version_id}/restore */
  restore: (projectId: string, versionId: string, editor: Person): Promise<GoalsState> =>
    previewGoals.restore(projectId, versionId, editor),
}

export const insightsService = {
  /** TODO(api): the weekly list endpoint (goal, reason, Open PR, Needs detail per issue). */
  forIssues: async (projectId: string): Promise<IssueInsights> =>
    USE_MOCKS ? previewInsights(projectId) : ISSUE_INSIGHTS_PLACEHOLDER,

  /** TODO(api): GET /project/{id}/linked-issues. Sample data until then. */
  linked: (repoUrl: string): Promise<LinkedIssues> => previewLinkedIssues(repoUrl),
}
