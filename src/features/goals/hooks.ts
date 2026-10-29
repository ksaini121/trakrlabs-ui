import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsService } from '@/api'
import { queryKeys } from '@/api/queryKeys'
import { useSession } from '@/features/auth/hooks'
import type { Goal, GoalsState, Person } from '@/types/domain'

/** TODO(api): goals read the in-browser preview adapter until GET /project/{id}/goals exists. */
export function useGoals(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.goals(projectId),
    queryFn: () => goalsService.get(projectId),
    enabled: Boolean(projectId),
  })
}

function useEditor(): Person {
  const { data: me } = useSession()
  return me ?? { id: 'unknown', login: 'you', name: 'You', avatarUrl: null }
}

/** Saving or restoring goals writes the new state straight into the cache. */
function useGoalsMutation<TVars>(projectId: string, mutationFn: (vars: TVars) => Promise<GoalsState>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (state) => {
      queryClient.setQueryData(queryKeys.projects.goals(projectId), state)
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.insights(projectId) })
    },
    meta: { handlesErrors: true },
  })
}

export function useSaveGoals(projectId: string) {
  const editor = useEditor()
  return useGoalsMutation(projectId, (goals: Goal[]) => goalsService.save(projectId, goals, editor))
}

export function useRestoreGoals(projectId: string) {
  const editor = useEditor()
  return useGoalsMutation(projectId, (versionId: string) => goalsService.restore(projectId, versionId, editor))
}
