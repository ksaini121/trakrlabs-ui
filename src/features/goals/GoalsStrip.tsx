import { History, Pencil, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import type { GoalVersion } from '@/types/domain'
import styles from './GoalsStrip.module.css'

interface GoalsStripProps {
  current: GoalVersion | null
  onEdit: () => void
  onShowHistory: () => void
  /** A line under the strip, e.g. the preview note while goals aren't saved to the server. */
  note?: ReactNode
}

/** The week's goals as one row of chips, so the board below gets the height. */
export function GoalsStrip({ current, onEdit, onShowHistory, note }: GoalsStripProps) {
  const goals = current?.goals ?? []
  return (
    <section className={styles.strip} aria-labelledby="goals-strip-heading">
      <div className={styles.row}>
        <h2 id="goals-strip-heading" className={styles.heading}>
          This week's goals
        </h2>
        {goals.length ? (
          <ol className={styles.chips}>
            {goals.map((goal, index) => (
              <li key={index} className={styles.chip} title={goal.target ?? undefined}>
                <IconBubble tone="number" size="xs">
                  {index + 1}
                </IconBubble>
                {goal.goal}
              </li>
            ))}
          </ol>
        ) : (
          <span className={styles.none}>No goals yet this week.</span>
        )}
        <div className={styles.actions}>
          {current && (
            <Button variant="ghost" size="sm" icon={<History size={14} />} onClick={onShowHistory}>
              History
            </Button>
          )}
          <Button
            variant={current ? 'soft' : 'primary'}
            size="sm"
            icon={current ? <Pencil size={14} /> : <Plus size={14} />}
            onClick={onEdit}
          >
            {current ? 'Edit goals' : 'Add goals'}
          </Button>
        </div>
      </div>
      {note}
    </section>
  )
}
