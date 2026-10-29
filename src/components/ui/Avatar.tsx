import { useState, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import { avatarTint, initialsOf } from '@/lib/people'
import type { Person } from '@/types/domain'
import styles from './Avatar.module.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

type AvatarSubject =
  | { person: Pick<Person, 'id' | 'name' | 'avatarUrl'>; email?: never }
  | { email: string; person?: never }

type AvatarProps = AvatarSubject & {
  size?: AvatarSize
  /** Adds a ring in this color so overlapping avatars separate cleanly. */
  ring?: string
  className?: string
}

export function Avatar({ person, email, size = 'md', ring, className }: AvatarProps) {
  const name = person?.name ?? email ?? ''
  // Falls back to initials when the image can't load (offline, unknown login).
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = person?.avatarUrl && person.avatarUrl !== failedUrl ? person.avatarUrl : null
  const style: CSSProperties = {
    background: person ? avatarTint(person.id) : 'var(--color-neutral-200)',
    ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : {}),
  }

  return (
    <span className={cn(styles.avatar, styles[size], className)} style={style} title={name}>
      {/* Initials sit under the photo, so they show while it loads or if it can't. */}
      <span aria-hidden>{person ? initialsOf(person.name) : initialsOf(email ?? '?').slice(0, 1)}</span>
      {imageUrl && <img src={imageUrl} alt="" className={styles.img} onError={() => setFailedUrl(imageUrl)} />}
      <span className="sr-only">{name}</span>
    </span>
  )
}

interface AvatarStackProps {
  people: Array<Pick<Person, 'id' | 'name' | 'avatarUrl'>>
  size?: AvatarSize
  /** Background the stack sits on; used for the separating ring. */
  ring?: string
  max?: number
}

export function AvatarStack({ people, size = 'sm', ring = 'var(--color-surface)', max = 5 }: AvatarStackProps) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className={styles.stack}>
      {shown.map((person) => (
        <Avatar key={person.id} person={person} size={size} ring={ring} />
      ))}
      {extra > 0 && (
        <span className={cn(styles.avatar, styles[size], styles.more)} style={{ boxShadow: `0 0 0 2px ${ring}` }}>
          +{extra}
        </span>
      )}
    </span>
  )
}

/** The dashed empty circle the design uses for "no one is assigned". */
export function UnassignedAvatar({ size = 'sm' }: { size?: AvatarSize }) {
  return <span className={cn(styles.avatar, styles[size], styles.unassigned)} title="Unassigned" />
}
