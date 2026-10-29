import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './StatusCard.module.css'

interface StatusCardProps {
  width?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

/**
 * The single rounded panel used by focused, one-decision screens:
 * accept invite, first sync, no access.
 */
export function StatusCard({ width = 'md', className, children }: StatusCardProps) {
  return (
    <div className={styles.page}>
      <section className={cn(styles.card, styles[width], className)}>{children}</section>
    </div>
  )
}
