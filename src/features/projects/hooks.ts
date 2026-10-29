import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsService } from '@/api'
import type { ProjectUpdate } from '@/api/dto'
import { queryKeys } from '@/api/queryKeys'
import { useMeId } from '@/features/auth/hooks'
import type { CreateProjectInput, Project, ProjectsOverview } from '@/types/domain'

const PROJECT_STALE_MS = 60_000

/** GET /project: every project you can open. */
export function useProjects<TData = Project[]>(select?: (projects: Project[]) => TData) {
  const meId = useMeId()
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => projectsService.list(meId),
    staleTime: PROJECT_STALE_MS,
    select,
  })
}

function splitByRole(projects: Project[]): ProjectsOverview {
  return {
    mine: projects.filter((p) => p.role === 'creator'),
    shared: projects.filter((p) => p.role === 'member'),
  }
}

/** Projects split into "My projects" (you created) and "Shared with me". */
export function useProjectsOverview() {
  return useProjects(splitByRole)
}

/** GET /project/{id}. Shows the list's copy straight away while the detail loads. */
export function useProject(projectId: string) {
  const meId = useMeId()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectsService.get(projectId, meId),
    staleTime: PROJECT_STALE_MS,
    enabled: Boolean(projectId),
    placeholderData: () =>
      queryClient.getQueryData<Project[]>(queryKeys.projects.list())?.find((p) => p.id === projectId),
  })
}

/** POST /project. Field errors from the API are shown on the form, so no global toast. */
export function useCreateProject() {
  const meId = useMeId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsService.create(input, meId),
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.projects.detail(project.id), project)
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
    },
    meta: { handlesErrors: true },
  })
}

/** PATCH /project/{id}. No screen uses it yet. */
export function useUpdateProject(projectId: string) {
  const meId = useMeId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: ProjectUpdate) => projectsService.update(projectId, changes, meId),
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.projects.detail(projectId), project)
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
    },
  })
}

/** DELETE /project/{id}. No screen uses it yet. */
export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => projectsService.remove(projectId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(projectId) })
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
    },
  })
}
