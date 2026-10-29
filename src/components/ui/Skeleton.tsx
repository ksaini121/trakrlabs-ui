import { cn } from '@/lib/cn'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: number
  shape?: 'pill' | 'circle'
  tone?: 'strong' | 'soft'
  className?: string
}

/** A placeholder bar or circle shown while content loads. */
export function Skeleton({ width = '100%', height = 14, shape = 'pill', tone = 'strong', className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(styles.skeleton, styles[shape], styles[tone], className)}
      style={{ width: shape === 'circle' ? height : width, height }}
    />
  )
}
