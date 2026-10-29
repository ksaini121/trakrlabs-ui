import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: 'sm' | 'lg'
  /** Announced to screen readers. Omit when nearby text already says what is loading. */
  label?: string
}

export function Spinner({ size = 'sm', label }: SpinnerProps) {
  return (
    <span
      className={size === 'lg' ? styles.lg : styles.sm}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
