import { useCreateProjectStore } from './createProjectStore'
import { useToastStore } from './toastStore'
import { useUiStore } from './uiStore'

export { useCreateProjectStore } from './createProjectStore'
export { usePreferencesStore } from './preferencesStore'
export { toast, useToastStore } from './toastStore'
export { useUiStore } from './uiStore'

/** On sign-out: forget everything about the session. Preferences stay. */
export function resetClientState(): void {
  useUiStore.getState().reset()
  useCreateProjectStore.getState().reset()
  useToastStore.getState().dismiss()
}
