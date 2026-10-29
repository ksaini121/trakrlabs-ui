import type { CreateProjectInput, Project } from '@/types/domain'
import { http } from '../client'
import type { ProjectCreate, ProjectOut, ProjectUpdate } from '../dto'
import { toProject } from '../mappers'

/** GET /project pages; one page covers far more projects than a v1 user has. */
const PROJECTS_PAGE = 100

export const projectsService = {
  /** GET /project: every project you created or are a member of. */
  list: async (meId: string | null): Promise<Project[]> => {
    const dtos = await http<ProjectOut[]>('GET', '/project', { query: { limit: PROJECTS_PAGE, offset: 0 } })
    return dtos.map((dto) => toProject(dto, meId))
  },

  /** GET /project/{id} */
  get: async (projectId: string, meId: string | null): Promise<Project> =>
    toProject(await http<ProjectOut>('GET', `/project/${encodeURIComponent(projectId)}`), meId),

  /** POST /project */
  create: async (input: CreateProjectInput, meId: string | null): Promise<Project> => {
    const json: ProjectCreate = {
      title: input.name.trim(),
      github_repo_name: input.repo.trim(),
      description: input.description?.trim() || null,
    }
    return toProject(await http<ProjectOut>('POST', '/project', { json }), meId)
  },

  /** PATCH /project/{id}. No UI uses it yet. */
  update: async (projectId: string, changes: ProjectUpdate, meId: string | null): Promise<Project> =>
    toProject(await http<ProjectOut>('PATCH', `/project/${encodeURIComponent(projectId)}`, { json: changes }), meId),

  /** DELETE /project/{id}. No UI uses it yet. */
  remove: async (projectId: string): Promise<void> => {
    await http('DELETE', `/project/${encodeURIComponent(projectId)}`)
  },
}
