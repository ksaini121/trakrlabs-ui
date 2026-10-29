import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './IconBubble.module.css'

export type IconBubbleTone = 'sage' | 'danger' | 'muted' | 'neutral' | 'accentSoft' | 'sageSoft' | 'number'

interface IconBubbleProps {
  tone?: IconBubbleTone
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children: ReactNode
}

/** A filled circle holding an icon or a short label — the design's recurring round accent. */
export function IconBubble({ tone = 'neutral', size = 'md', className, children }: IconBubbleProps) {
  return <span className={cn(styles.bubble, styles[tone], styles[size], className)}>{children}</span>
}
