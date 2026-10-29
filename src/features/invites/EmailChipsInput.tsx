import { TriangleAlert, X } from 'lucide-react'
import { useId } from 'react'
import type { EmailDraft } from './useEmailDraft'
import styles from './EmailChipsInput.module.css'

interface EmailChipsInputProps {
  label: string
  state: EmailDraft
}

/** Type emails separated by commas, spaces or Enter; each becomes a removable chip. */
export function EmailChipsInput({ label, state }: EmailChipsInputProps) {
  const inputId = useId()
  const errorId = useId()

  return (
    <div className={styles.root}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.box}>
        {state.chips.map((email) => (
          <span key={email} className={styles.chip}>
            {email}
            <button type="button" className={styles.remove} aria-label={`Remove ${email}`} onClick={() => state.removeChip(email)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className={styles.input}
          type="text"
          inputMode="email"
          autoComplete="off"
          value={state.draft}
          placeholder={state.chips.length ? 'Add another…' : 'name@company.com, separate with commas'}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? errorId : undefined}
          onChange={(e) => state.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && state.draft.trim()) {
              e.preventDefault()
              state.commit()
            } else if (e.key === 'Backspace' && !state.draft && state.chips.length) {
              state.removeChip(state.chips[state.chips.length - 1])
            }
          }}
          onBlur={() => state.draft.trim() && state.commit()}
        />
      </div>
      {state.error && (
        <div id={errorId} className={styles.error} role="alert">
          <TriangleAlert />
          {state.error}
        </div>
      )}
    </div>
  )
}
