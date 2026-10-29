import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, TextInput } from '@/components/ui/Field'

interface ReplaceTokenDialogProps {
  open: boolean
  repoFullName: string
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (token: string) => void
}

export function ReplaceTokenDialog({ open, repoFullName, ...rest }: ReplaceTokenDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={rest.onClose}
      title="Replace access token"
      description={`Paste a new read-only token for ${repoFullName}. The old one is discarded.`}
    >
      <ReplaceTokenForm {...rest} />
    </Dialog>
  )
}

function ReplaceTokenForm({ saving, error, onClose, onSave }: Omit<ReplaceTokenDialogProps, 'open' | 'repoFullName'>) {
  const [token, setToken] = useState('')
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (token.trim()) onSave(token.trim())
  }
  return (
    <form onSubmit={onSubmit}>
      <Field label="New access token" error={error} hint="Issues and Pull requests set to Read-only.">
        {({ inputId, describedBy }) => (
          <TextInput
            id={inputId}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
            autoFocus
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!token.trim()}>
          Replace token
        </Button>
      </div>
    </form>
  )
}
