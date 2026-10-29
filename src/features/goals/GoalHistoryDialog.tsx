import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Tag } from '@/components/ui/Tag'
import { formatDateTime } from '@/lib/dates'
import type { GoalVersion } from '@/types/domain'
import styles from './GoalHistoryDialog.module.css'

interface GoalHistoryDialogProps {
  open: boolean
  versions: GoalVersion[]
  currentId: string | null
  /** The version being restored, while the request runs. */
  restoringId: string | null
  onRestore: (version: GoalVersion) => void
  onClose: () => void
}

/** Every saved version of the goals, newest first, with Restore on older ones. */
export function GoalHistoryDialog({ open, versions, currentId, restoringId, onRestore, onClose }: GoalHistoryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Goal history" dismissible>
      {versions.length === 0 && <p className={styles.empty}>No goals have been saved yet.</p>}
      <ol className={styles.list}>
        {versions.map((version) => (
          <li key={version.id} className={styles.item}>
            <Avatar person={version.editedBy} size="md" />
            <div className={styles.body}>
              <div>
                <strong>{version.editedBy.name}</strong> · {formatDateTime(version.editedAt)}
              </div>
              <ol className={styles.goals}>
                {version.goals.map((goal, i) => (
                  <li key={i}>{goal.goal}</li>
                ))}
              </ol>
            </div>
            {version.id === currentId ? (
              <Tag tone="sage" className={styles.side}>
                Current
              </Tag>
            ) : (
              <Button
                className={styles.side}
                loading={restoringId === version.id}
                disabled={restoringId !== null}
                onClick={() => onRestore(version)}
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ol>
    </Dialog>
  )
}
