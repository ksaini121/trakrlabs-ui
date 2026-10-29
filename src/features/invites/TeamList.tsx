import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/dates'
import { memberAsPerson } from '@/lib/people'
import type { Member } from '@/types/domain'
import styles from './TeamList.module.css'

interface TeamListProps {
  members: Member[] | undefined
  /** Shown under the list when no one but you is in the project. */
  emptyNote?: string
  onRemove: (member: Member) => void
  className?: string
}

function describe(member: Member): { label: string; sub: string } {
  const name = member.login ? `@${member.login}` : member.email
  const label = member.isYou ? `${name} (you)` : name
  if (member.isCreator) return { label, sub: 'Created this project' }
  if (member.status === 'invited') {
    return { label, sub: `Added ${formatRelative(member.addedAt)} · hasn't signed in yet` }
  }
  return { label, sub: member.email }
}

/** The people in a project. Removal is instant (the row comes back if it fails). */
export function TeamList({ members, emptyNote, onRemove, className }: TeamListProps) {
  return (
    <section className={cn(styles.list, className)} aria-labelledby="team-heading">
      <h2 id="team-heading" className={styles.heading}>
        People in this project
      </h2>

      {!members &&
        [0, 1, 2].map((i) => (
          <div key={i} className={styles.row} aria-hidden>
            <Skeleton shape="circle" height={34} />
            <Skeleton width="40%" />
          </div>
        ))}

      {members?.map((member) => {
        const { label, sub } = describe(member)
        return (
          <div key={member.id} className={styles.row}>
            <Avatar person={memberAsPerson(member)} size="md" />
            <div className={styles.who}>
              <div className={styles.label}>{label}</div>
              <div className={styles.sub}>{sub}</div>
            </div>
            {member.status === 'member' ? <Tag tone="neutral">Member</Tag> : <Tag tone="sage">Invited</Tag>}
            <div className={styles.actions}>
              {!member.isYou && !member.isCreator && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.remove}
                  onClick={() => onRemove(member)}
                  aria-label={`Remove ${label}`}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )
      })}

      {members && members.filter((m) => !m.isYou).length === 0 && emptyNote && (
        <div className={styles.empty}>{emptyNote}</div>
      )}
    </section>
  )
}
