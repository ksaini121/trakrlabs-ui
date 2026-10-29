import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/stores/toastStore'
import { EmailChipsInput } from './EmailChipsInput'
import { TeamList } from './TeamList'
import { useAddMembers, useMembers, useRemoveMember, type AddMembersResult } from './hooks'
import { useEmailDraft, type EmailDraft } from './useEmailDraft'
import styles from './InviteTeamDialog.module.css'

interface InviteTeamDialogProps {
  open: boolean
  projectId: string
  projectName: string
  /**
   * `onboarding`: step 2 of creating a project, with Continue / Skip for now.
   * `manage`: opened from the dashboard to add or remove people.
   */
  mode: 'onboarding' | 'manage'
  /** Closing the popup (×, Escape, backdrop, Done). In onboarding this moves to the next step. */
  onClose: () => void
}

export function InviteTeamDialog({ open, projectId, projectName, mode, onClose }: InviteTeamDialogProps) {
  const onboarding = mode === 'onboarding'
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible
      eyebrow={onboarding ? 'Project created · Step 2 of 3' : undefined}
      title="Invite your team"
      description={`Everyone in ${projectName} sees the same dashboard and can edit the weekly goals. People you add get access when they sign in with GitHub using that email.`}
    >
      {/* Mounted only while open, so typed emails start empty each time. */}
      <InviteTeamContent projectId={projectId} onboarding={onboarding} onClose={onClose} />
    </Dialog>
  )
}

/** Keeps the emails the server turned down in the box, with the reason. */
function reportResult({ added, failed }: AddMembersResult, emails: EmailDraft) {
  if (added.length) toast.show(`Added ${added.length === 1 ? '1 person' : `${added.length} people`}`)
  if (!failed.length) {
    emails.clear()
    return
  }
  emails.setChips(failed.map((f) => f.email))
  emails.setError(
    failed.length === 1
      ? failed[0].message
      : `${failed.length} couldn't be added: ${failed.map((f) => `${f.email} (${f.message})`).join('; ')}`,
  )
}

function InviteTeamContent({ projectId, onboarding, onClose }: { projectId: string; onboarding: boolean; onClose: () => void }) {
  const members = useMembers(projectId)
  const emails = useEmailDraft()
  const add = useAddMembers(projectId)
  const remove = useRemoveMember(projectId)

  const onAdd = () => {
    const list = emails.draft.trim() ? emails.commit() : emails.chips
    if (!list) return
    if (!list.length) {
      emails.setError('Add at least one email address.')
      return
    }
    add.mutate(list, { onSuccess: (result) => reportResult(result, emails) })
  }

  return (
    <div className={styles.content}>
      <div className={styles.sendRow}>
        <EmailChipsInput label="Email addresses" state={emails} />
        <Button variant="primary" className={styles.send} loading={add.isPending} onClick={onAdd}>
          Add people
        </Button>
      </div>

      <TeamList
        className={styles.team}
        members={members.data}
        emptyNote={onboarding ? 'No one added yet. You can always add people later from the dashboard.' : undefined}
        onRemove={(member) =>
          remove.mutate(member, { onSuccess: () => toast.show(`${member.login ? `@${member.login}` : member.email} removed`) })
        }
      />

      <div className="dialog-actions">
        {onboarding ? (
          <>
            <Button onClick={onClose}>Skip for now</Button>
            <Button variant="primary" onClick={onClose}>
              Continue
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
