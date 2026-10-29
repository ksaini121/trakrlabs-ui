import { FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './PreviewNote.module.css'

/**
 * A quiet line marking a feature that runs on preview data, e.g. goals that
 * aren't saved to the server yet. TODO(api): remove each use when its endpoint ships.
 */
export function PreviewNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn(styles.note, className)}>
      <FlaskConical size={14} className={styles.icon} aria-hidden />
      <span>
        <strong>Preview:</strong> {children}
      </span>
    </p>
  )
}
