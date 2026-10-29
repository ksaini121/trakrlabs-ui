import type { Member } from '@/types/domain'
import { http } from '../client'
import type { MemberCreate, MemberOut } from '../dto'
import { toMember, toMemberList, type MemberContext } from '../mappers'

const base = (projectId: string) => `/project/${encodeURIComponent(projectId)}/member`

export const membersService = {
  /** GET /project/{id}/member */
  list: async (projectId: string, context: MemberContext): Promise<Member[]> =>
    toMemberList(await http<MemberOut[]>('GET', base(projectId)), context),

  /** POST /project/{id}/member: one email per call. */
  add: async (projectId: string, email: string, context: MemberContext): Promise<Member> => {
    const json: MemberCreate = { email: email.trim() }
    return toMember(await http<MemberOut>('POST', base(projectId), { json }), context)
  },

  /** DELETE /project/{id}/member/{member_id} */
  remove: async (projectId: string, memberId: string): Promise<void> => {
    await http('DELETE', `${base(projectId)}/${encodeURIComponent(memberId)}`)
  },
}
