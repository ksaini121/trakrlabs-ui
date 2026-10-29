import { Check, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/lib/cn'
import styles from './Toast.module.css'

const TOAST_MS = 2800
const ERROR_TOAST_MS = 5000

/** Renders the current toast from the toast store. Mounted once, in App. */
export function Toaster() {
  const toast = useToastStore((s) => s.toast)
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, toast.tone === 'error' ? ERROR_TOAST_MS : TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  return (
    <div className={styles.region} aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'}>
      {toast && (
        <div key={toast.id} className={cn(styles.toast, toast.tone === 'error' && styles.error)} role="status">
          {toast.tone === 'error' ? <TriangleAlert className={styles.icon} /> : <Check className={styles.icon} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
