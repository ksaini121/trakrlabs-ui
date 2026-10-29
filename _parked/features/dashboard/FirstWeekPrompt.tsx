import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconBubble } from '@/components/ui/IconBubble'
import styles from './FirstWeekPrompt.module.css'

interface FirstWeekPromptProps {
  openIssueCount: number
  repoFullName: string
  onAddGoals: () => void
}

/** Shown in place of the list before a project has ever had goals. */
export function FirstWeekPrompt({ openIssueCount, repoFullName, onAddGoals }: FirstWeekPromptProps) {
  return (
    <div className={styles.prompt}>
      <IconBubble tone="sageSoft" size="xl">
        <Target size={40} />
      </IconBubble>
      <div className={styles.text}>
        <h3 className={styles.title}>Add goals to see this week's list</h3>
        <p className={styles.body}>
          Trakr will rank the {openIssueCount} open issues in {repoFullName} against your goals and find issues that
          should be solved together. The first list is ready about a minute after you save.
        </p>
        <Button variant="primary" icon={<Plus />} onClick={onAddGoals}>
          Add this week's goals
        </Button>
      </div>
    </div>
  )
}
