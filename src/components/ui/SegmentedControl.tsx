import { cn } from '@/lib/cn'
import styles from './SegmentedControl.module.css'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  /** Shown as a tooltip; say why when the option is disabled. */
  title?: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  /** Names the group for screen readers, e.g. "View" or "Group by". */
  label: string
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A pill switch of buttons, one pressed at a time: List | Board, Status | Person | Goal. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn(styles.group, className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(styles.segment, option.value === value && styles.active)}
          aria-pressed={option.value === value}
          // aria-disabled (not disabled) keeps the option focusable, so its tooltip says why.
          aria-disabled={option.disabled || undefined}
          title={option.title}
          onClick={() => !option.disabled && option.value !== value && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
