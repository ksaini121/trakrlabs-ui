import { cn } from '@/lib/cn'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Class names for a design-system button. Also used to style router links as buttons. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string): string {
  return cn(
    'btn',
    variant === 'primary' && 'btn-primary',
    (variant === 'secondary' || variant === 'soft') && 'btn-secondary',
    variant === 'soft' && styles.soft,
    variant === 'ghost' && 'btn-ghost',
    variant === 'icon' && 'btn-icon',
    size !== 'md' && styles[size],
    className,
  )
}
