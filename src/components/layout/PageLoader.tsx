import { Spinner } from '@/components/ui/Spinner'
import styles from './PageLoader.module.css'

/** Full-area loading state used while a route resolves the session. */
export function PageLoader() {
  return (
    <div className={styles.loader}>
      <Spinner size="lg" label="Loading" />
    </div>
  )
}
