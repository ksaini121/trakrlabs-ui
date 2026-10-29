import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membersService } from '@/api'
import { isApiError } from '@/api/errors'
import type { MemberContext } from '@/api/mappers'
import { queryKeys } from '@/api/queryKeys'
import { useSession } from '@/features/auth/hooks'
import { useProject } from '@/features/projects/hooks'
import { toast } from '@/stores/toastStore'
import type { Member } from '@/types/domain'

const MEMBERS_STALE_MS = 30_000

/** What the member mapper needs: who you are and who created the project. */
function useMemberContext(projectId: string): MemberContext | null {
  const { data: me } = useSession()
  const { data: project } = useProject(projectId)
  if (!me || !project) return null
  return { me, createdById: project.createdById }
}

/** GET /project/{id}/member */
export function useMembers(projectId: string) {
  const context = useMemberContext(projectId)
  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => membersService.list(projectId, context as MemberContext),
    enabled: context !== null,
    staleTime: MEMBERS_STALE_MS,
  })
}

export interface AddMembersResult {
  added: Member[]
  failed: Array<{ email: string; message: string }>
}

/**
 * POST /project/{id}/member, once per email, all at the same time. Never
 * rejects: it reports which emails were added and why the others weren't.
 */
export function useAddMembers(projectId: string) {
  const context = useMemberContext(projectId)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (emails: string[]): Promise<AddMembersResult> => {
      const results = await Promise.allSettled(
        emails.map((email) => membersService.add(projectId, email, context as MemberContext)),
      )
      const result: AddMembersResult = { added: [], failed: [] }
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') result.added.push(r.value)
        else {
          const error = r.reason
          const message = isApiError(error)
            ? (error.fieldErrors.email ?? error.message)
            : 'Could not be added. Try again.'
          result.failed.push({ email: emails[i], message })
        }
      })
      return result
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) }),
  })
}

/**
 * DELETE /project/{id}/member/{member_id}. The person leaves the list at once
 * and comes back if the call fails.
 */
export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.projects.members(projectId)
  return useMutation({
    mutationFn: (member: Member) => membersService.remove(projectId, member.id),
    onMutate: async (member) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Member[]>(key)
      queryClient.setQueryData<Member[]>(key, (list) => list?.filter((m) => m.id !== member.id))
      return { previous }
    },
    onError: (_error, member, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(`Couldn't remove ${member.login ?? member.email}. Try again.`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
    meta: { handlesErrors: true },
  })
}
