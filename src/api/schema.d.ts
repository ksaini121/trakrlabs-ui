/**
 * Types for the Trakr FastAPI backend, in the shape openapi-typescript generates.
 *
 * Regenerate from the running backend with `npm run api:types` (it overwrites this
 * file). Don't edit by hand except to bootstrap: this first version was written
 * from the backend's OpenAPI spec so the app compiles before the first generation.
 */

export interface paths {
  '/health': { get: { responses: { 200: { content: { 'application/json': unknown } } } } }
  '/auth/github/login': { get: { parameters: { query?: { next?: string } } } }
  '/auth/github/callback': { get: { parameters: { query?: { code?: string; state?: string } } } }
  '/auth/me': { get: { responses: { 200: { content: { 'application/json': components['schemas']['UserOut'] } } } } }
  '/auth/logout': { post: { responses: { 200: { content: { 'application/json': unknown } } } } }
  '/project': {
    get: {
      parameters: { query?: { limit?: number; offset?: number } }
      responses: { 200: { content: { 'application/json': components['schemas']['ProjectOut'][] } } }
    }
    post: {
      requestBody: { content: { 'application/json': components['schemas']['ProjectCreate'] } }
      responses: { 201: { content: { 'application/json': components['schemas']['ProjectOut'] } } }
    }
  }
  '/project/{project_id}': {
    get: { responses: { 200: { content: { 'application/json': components['schemas']['ProjectOut'] } } } }
    patch: {
      requestBody: { content: { 'application/json': components['schemas']['ProjectUpdate'] } }
      responses: { 200: { content: { 'application/json': components['schemas']['ProjectOut'] } } }
    }
    delete: { responses: { 204: never } }
  }
  '/project/{project_id}/member': {
    get: { responses: { 200: { content: { 'application/json': components['schemas']['MemberOut'][] } } } }
    post: {
      requestBody: { content: { 'application/json': components['schemas']['MemberCreate'] } }
      responses: { 201: { content: { 'application/json': components['schemas']['MemberOut'] } } }
    }
  }
  '/project/{project_id}/member/{member_id}': { delete: { responses: { 204: never } } }
  '/issue': {
    get: {
      parameters: { query: { project_id: string; state?: string; limit?: number; offset?: number } }
      responses: { 200: { content: { 'application/json': components['schemas']['IssueOut'][] } } }
    }
  }
  '/issue/sync': {
    post: {
      requestBody: { content: { 'application/json': components['schemas']['IssueSyncRequest'] } }
      responses: { 200: { content: { 'application/json': components['schemas']['IssueSyncResponse'] } } }
    }
  }
  '/issue/{issue_id}': {
    get: { responses: { 200: { content: { 'application/json': components['schemas']['IssueOut'] } } } }
  }
}

export interface components {
  schemas: {
    UserOut: {
      /** Format: uuid */
      id: string
      github_id: number
      username: string
      email: string | null
      avatar_url: string | null
      user_role: string
      /** Format: date-time */
      created_at?: string
    }
    ProjectCreate: {
      title: string
      description?: string | null
      /** owner/repo, matching ^[\w.-]+/[\w.-]+$ */
      github_repo_name: string
      /** Format: uuid */
      project_admin_id?: string | null
    }
    ProjectUpdate: {
      title?: string | null
      description?: string | null
      github_repo_name?: string | null
      /** Format: uuid */
      project_admin_id?: string | null
    }
    ProjectOut: {
      /** Format: uuid */
      id: string
      title: string
      description: string | null
      github_repo_name: string
      /** Format: uuid */
      project_admin_id: string | null
      /** Format: uuid */
      created_by: string
      /** Format: date-time */
      created_at: string
      /** Format: date-time */
      updated_at: string
    }
    MemberCreate: {
      /** Format: email */
      email: string
    }
    MemberOut: {
      /** Format: uuid */
      id: string
      email: string
      /** Format: uuid */
      invited_by: string
      /** Format: date-time */
      created_at: string
      /** GitHub login, null until the person signs in. */
      username: string | null
    }
    IssueOut: {
      /** Format: uuid */
      id: string
      /** Format: uuid */
      project_id: string
      number: number
      title: string
      body: string | null
      state: string
      html_url: string
      author_login: string | null
      assignees: string[]
      labels: string[]
      milestone: string | null
      comments_count: number
      /** Format: date-time */
      github_created_at: string
      /** Format: date-time */
      github_updated_at: string
      /** Format: date-time */
      github_closed_at: string | null
      /** Format: date-time */
      synced_at: string
    }
    IssueSyncRequest: {
      /** Format: uuid */
      project_id: string
    }
    IssueSyncResponse: {
      /** Format: uuid */
      project_id: string
      synced: number
    }
    ValidationError: {
      loc: (string | number)[]
      msg: string
      type: string
    }
    HTTPValidationError: {
      detail?: components['schemas']['ValidationError'][]
    }
  }
}
