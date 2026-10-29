import { cn } from '@/lib/cn'
import styles from './Brand.module.css'

/** The Trakr mark: a terracotta circle with a cream dot, and the wordmark. */
export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={cn(styles.brand, styles[size])}>
      <span className={styles.mark} aria-hidden>
        <span className={styles.dot} />
      </span>
      <span className={styles.word}>Trakr</span>
    </span>
  )
}
