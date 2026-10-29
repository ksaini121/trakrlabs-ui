import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { cn } from '@/lib/cn'
import styles from './FilterMenu.module.css'

export interface FilterOption<T extends string> {
  value: T | null
  label: string
  leading?: ReactNode
}

interface FilterMenuProps<T extends string> {
  /** Button text when nothing is chosen, e.g. "Status". */
  name: string
  title: string
  options: ReadonlyArray<FilterOption<T>>
  value: T | null
  onChange: (value: T | null) => void
  /** Sort menus are never "active": they always have a value. */
  showValue?: boolean
}

/** A pill button that opens a single-choice menu, GitHub-style. */
export function FilterMenu<T extends string>({ name, title, options, value, onChange, showValue = true }: FilterMenuProps<T>) {
  const selected = options.find((o) => o.value === value)
  const active = showValue && value !== null && selected

  return (
    <Menu
      title={title}
      trigger={(props) => (
        <button type="button" className={cn(styles.trigger, active && styles.active)} {...props}>
          {active ? `${name}: ${selected.label}` : name}
          <ChevronDown size={14} />
        </button>
      )}
    >
      {(close) =>
        options.map((option) => (
          <MenuItem
            key={option.value ?? 'any'}
            selected={option.value === value}
            leading={option.leading}
            onSelect={() => {
              onChange(option.value)
              close()
            }}
          >
            {option.label}
          </MenuItem>
        ))
      }
    </Menu>
  )
}
