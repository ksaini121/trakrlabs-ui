import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './Banner.module.css'

export type BannerTone = 'danger' | 'neutral' | 'sage' | 'soft'

interface BannerProps {
  tone?: BannerTone
  icon?: ReactNode
  action?: ReactNode
  /** Use for problems the user should notice right away. */
  urgent?: boolean
  className?: string
  children: ReactNode
}

/** A rounded, full-width message strip: sync problems, generating state, invites. */
export function Banner({ tone = 'neutral', icon, action, urgent, className, children }: BannerProps) {
  return (
    <div className={cn(styles.banner, styles[tone], className)} role={urgent ? 'alert' : 'status'}>
      {icon}
      <div className={styles.body}>{children}</div>
      {action}
    </div>
  )
}
