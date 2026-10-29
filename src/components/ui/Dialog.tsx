import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import styles from './Dialog.module.css'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Small label above the title, e.g. "Step 2 of 3". */
  eyebrow?: ReactNode
  description?: ReactNode
  /** Shows an × button in the header. */
  dismissible?: boolean
  footer?: ReactNode
  width?: 'md' | 'lg'
  children: ReactNode
}

/**
 * Modal built on the native <dialog> element, which gives focus trapping,
 * Escape-to-close and an inert page behind it for free.
 */
export function Dialog({ open, onClose, title, eyebrow, description, dismissible, footer, width = 'md', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      className={cn(styles.native, styles[width])}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click on the <dialog> itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={cn('dialog', styles.panel)}>
        {eyebrow && <div className={cn('eyebrow', styles.eyebrow)}>{eyebrow}</div>}
        <div className={styles.header}>
          <h2 id={titleId} className={cn('dialog-title', styles.title)}>
            {title}
          </h2>
          {dismissible && <Button variant="icon" aria-label="Close" icon={<X />} onClick={onClose} />}
        </div>
        {description && <div className={styles.description}>{description}</div>}
        {children}
        {footer && <div className="dialog-actions">{footer}</div>}
      </div>
    </dialog>
  )
}
