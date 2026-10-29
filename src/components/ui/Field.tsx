import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  /** Shown under the input. */
  hint?: ReactNode
  error?: string | null
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode
  className?: string
}

/** Label + control + hint/error, wired up for accessibility. */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const inputId = useId()
  const hintId = useId()
  const describedBy = hint || error ? hintId : undefined
  return (
    <div className={cn('field', className)}>
      <label htmlFor={inputId}>{label}</label>
      {children({ inputId, describedBy })}
      {(hint || error) && (
        <div id={hintId} className={cn(styles.hint, error && styles.error)} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </div>
      )}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: never
  inputSize?: 'md' | 'lg'
  surface?: 'default' | 'raised'
}

export function TextInput({ inputSize = 'lg', surface = 'default', className, ...rest }: TextInputProps) {
  return (
    <input
      className={cn('input', inputSize === 'lg' && styles.lg, surface === 'raised' && styles.raised, className)}
      {...rest}
    />
  )
}
