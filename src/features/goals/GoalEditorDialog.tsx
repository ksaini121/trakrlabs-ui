import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextInput } from '@/components/ui/Field'
import { IconBubble } from '@/components/ui/IconBubble'
import { MAX_GOALS, type Goal } from '@/types/domain'
import styles from './GoalEditorDialog.module.css'

interface GoalEditorDialogProps {
  open: boolean
  initialGoals: Goal[]
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (goals: Goal[]) => void
}

export function GoalEditorDialog({ open, ...rest }: GoalEditorDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={rest.onClose}
      width="lg"
      title="This week's goals"
      description="Up to three. Only the goal is required. Everyone in the project sees who edited them."
    >
      {/* Mounted only while open, so the draft starts from the saved goals each time. */}
      <GoalEditorForm {...rest} />
    </Dialog>
  )
}

interface DraftRow {
  goal: string
  target: string
  dueDate: string
}

function toDraft(goals: Goal[]): DraftRow[] {
  return Array.from({ length: MAX_GOALS }, (_, i) => ({
    goal: goals[i]?.goal ?? '',
    target: goals[i]?.target ?? '',
    dueDate: goals[i]?.dueDate ?? '',
  }))
}

function fromDraft(rows: DraftRow[]): Goal[] {
  return rows
    .filter((row) => row.goal.trim())
    .map((row) => ({ goal: row.goal.trim(), target: row.target.trim() || null, dueDate: row.dueDate || null }))
}

function GoalEditorForm({ initialGoals, saving, error, onClose, onSave }: Omit<GoalEditorDialogProps, 'open'>) {
  const [rows, setRows] = useState<DraftRow[]>(() => toDraft(initialGoals))
  const goals = fromDraft(rows)

  const update = (index: number, field: keyof DraftRow, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (goals.length) onSave(goals)
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.grid} role="group" aria-label="Goals">
        <span />
        <span className={styles.colLabel}>Goal</span>
        <span className={styles.colLabel}>
          Target (optional)
        </span>
        <span className={styles.colLabel}>
          Date (optional)
        </span>
        {rows.map((row, index) => (
          <div key={index} className={styles.row}>
            <IconBubble tone="number" size="sm">
              {index + 1}
            </IconBubble>
            <TextInput
              surface="raised"
              value={row.goal}
              onChange={(e) => update(index, 'goal', e.target.value)}
              placeholder="What matters most this week?"
              aria-label={`Goal ${index + 1}`}
              autoFocus={index === 0}
              maxLength={120}
            />
            <TextInput
              surface="raised"
              value={row.target}
              onChange={(e) => update(index, 'target', e.target.value)}
              placeholder="e.g. 3 pilot users onboarded"
              aria-label={`Target for goal ${index + 1}`}
              maxLength={120}
            />
            <TextInput
              surface="raised"
              type="date"
              value={row.dueDate}
              onChange={(e) => update(index, 'dueDate', e.target.value)}
              aria-label={`Date for goal ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!goals.length}>
          Save goals
        </Button>
      </div>
    </form>
  )
}
