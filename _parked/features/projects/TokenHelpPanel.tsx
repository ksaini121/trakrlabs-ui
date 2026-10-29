import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import styles from './TokenHelpPanel.module.css'

/** Step-by-step help for creating a fine-grained, read-only GitHub token. */
export function TokenHelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className={styles.panel} aria-labelledby="token-help-title">
      <div className={styles.header}>
        <h2 id="token-help-title" className={styles.title}>
          Create a read-only token
        </h2>
        <Button variant="icon" aria-label="Close help" icon={<X />} onClick={onClose} />
      </div>
      <ol className={styles.steps}>
        <li>
          In GitHub, open <strong>Settings → Developer settings → Fine-grained tokens</strong>.
        </li>
        <li>
          Under <strong>Repository access</strong>, choose <strong>Only select repositories</strong> and pick this
          repo.
        </li>
        <li>
          Under <strong>Permissions</strong>, set <strong>Issues</strong> and <strong>Pull requests</strong> to{' '}
          <strong>Read-only</strong>.
        </li>
        <li>Generate the token and paste it here.</li>
      </ol>
      <p className={styles.note}>If your repo belongs to an organisation, an owner may need to approve the token.</p>
    </aside>
  )
}
