/**
 * Readable names for the backend's request and response shapes.
 * Everything here comes from the generated `schema.d.ts`; only mappers and
 * services import these. Components use the app's own types in `@/types/domain`.
 */
import type { components } from './schema'

type Schemas = components['schemas']

export type UserOut = Schemas['UserOut']
export type ProjectOut = Schemas['ProjectOut']
export type ProjectCreate = Schemas['ProjectCreate']
export type ProjectUpdate = Schemas['ProjectUpdate']
export type MemberOut = Schemas['MemberOut']
export type MemberCreate = Schemas['MemberCreate']
export type IssueOut = Schemas['IssueOut']
export type IssueSyncRequest = Schemas['IssueSyncRequest']
export type IssueSyncResponse = Schemas['IssueSyncResponse']
export type ValidationErrorItem = Schemas['ValidationError']

/** Values `GET /issue?state=` accepts. */
export type IssueStateParam = 'open' | 'closed' | 'all'
