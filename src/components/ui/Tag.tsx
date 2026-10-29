import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './Tag.module.css'

export type TagTone = 'accent' | 'sage' | 'neutral' | 'outline' | 'warning'

const TONE_CLASS: Record<TagTone, string> = {
  accent: 'tag-accent',
  sage: 'tag-accent-2',
  neutral: 'tag-neutral',
  outline: 'tag-outline',
  warning: cn('tag-outline', styles.warning),
}

interface TagProps {
  tone?: TagTone
  icon?: ReactNode
  bold?: boolean
  className?: string
  children: ReactNode
}

/** The design system's small tinted label. */
export function Tag({ tone = 'neutral', icon, bold, className, children }: TagProps) {
  return (
    <span className={cn('tag', TONE_CLASS[tone], styles.tag, bold && styles.bold, className)}>
      {icon}
      {children}
    </span>
  )
}
