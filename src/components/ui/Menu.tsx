import { useId, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import styles from './Menu.module.css'

interface TriggerProps {
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string
  onClick: () => void
}

interface MenuProps {
  /** Render the button that opens the menu; spread `props` onto it. */
  trigger: (props: TriggerProps, open: boolean) => ReactNode
  title?: string
  align?: 'left' | 'right'
  width?: number
  /** Menu contents. Call `close` after an item is picked. */
  children: (close: () => void) => ReactNode
}

export function Menu({ trigger, title, align = 'right', width = 250, children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const close = () => setOpen(false)
  useDismiss(ref, open, close)

  return (
    <div ref={ref} className={styles.root}>
      {trigger(
        { 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': menuId, onClick: () => setOpen((o) => !o) },
        open,
      )}
      {open && (
        <div id={menuId} role="menu" className={cn(styles.menu, styles[align])} style={{ width }}>
          {title && <div className={styles.title}>{title}</div>}
          {children(close)}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  onSelect: () => void
  /** Shows a check mark column, for single-choice menus. */
  selected?: boolean
  leading?: ReactNode
  children: ReactNode
}

export function MenuItem({ onSelect, selected, leading, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role={selected === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={selected}
      className={styles.item}
      onClick={onSelect}
    >
      {selected !== undefined && <span className={styles.check}>{selected && <Check size={16} />}</span>}
      {leading}
      {children}
    </button>
  )
}
