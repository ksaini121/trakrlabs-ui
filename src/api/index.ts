/**
 * The app's only entry point to the backend: one service per area.
 * Hooks in `src/features/*` call these; components never do.
 */
export { authService } from './services/auth'
export { projectsService } from './services/projects'
export { membersService } from './services/members'
export { issuesService } from './services/issues'
export { goalsService, insightsService } from './services/preview'
