import { githubAvatarPlaceholder } from '@/api/placeholders'
import type { Person } from '@/types/domain'

/** "Alex Morgan" → "AM", "priya" → "P". */
export function initialsOf(nameOrEmail: string): string {
  const base = nameOrEmail.split('@')[0]
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0]?.[0] ?? '?')
  return letters.toUpperCase()
}

export function firstName(person: Person): string {
  return person.name.split(' ')[0] || person.login
}

/** Warm tints from the Organic ramps, picked per person so colors stay stable. */
const AVATAR_TINTS = [
  'var(--color-accent-300)',
  'var(--color-accent-2-300)',
  'var(--color-neutral-300)',
  'var(--color-accent-200)',
  'var(--color-accent-2-200)',
] as const

export function avatarTint(seed: number | string): string {
  const n =
    typeof seed === 'number'
      ? seed
      : [...seed].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return AVATAR_TINTS[n % AVATAR_TINTS.length]
}

/** A project member as an avatar: their GitHub login once they've signed in, otherwise their email. */
export function memberAsPerson(member: { id: string; login: string | null; email: string }): Person {
  return member.login
    ? { id: member.id, login: member.login, name: member.login, avatarUrl: githubAvatarPlaceholder(member.login) }
    : { id: member.id, login: member.email, name: member.email, avatarUrl: null }
}
