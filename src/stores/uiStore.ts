import { create } from 'zustand'

export interface InviteDialogState {
  projectId: string
  projectName: string
  /**
   * `onboarding`: step 2 of creating a project; closing it moves on to the first sync.
   * `manage`: opened from the dashboard.
   */
  mode: 'onboarding' | 'manage'
}

interface UiState {
  /** The invite popup, rendered once in the app layout. */
  inviteDialog: InviteDialogState | null
  goalEditorOpen: boolean
  goalHistoryOpen: boolean

  openInvite: (dialog: InviteDialogState) => void
  closeInvite: () => void
  setGoalEditorOpen: (open: boolean) => void
  setGoalHistoryOpen: (open: boolean) => void
  reset: () => void
}

const initial = { inviteDialog: null, goalEditorOpen: false, goalHistoryOpen: false }

/** Which popup is open, and for what. Not persisted. */
export const useUiStore = create<UiState>()((set) => ({
  ...initial,
  openInvite: (inviteDialog) => set({ inviteDialog }),
  closeInvite: () => set({ inviteDialog: null }),
  setGoalEditorOpen: (goalEditorOpen) => set({ goalEditorOpen }),
  setGoalHistoryOpen: (goalHistoryOpen) => set({ goalHistoryOpen }),
  reset: () => set(initial),
}))
