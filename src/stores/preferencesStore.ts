import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localJSONStorage } from './safeStorage'

/**
 * Dashboard layouts from the design:
 * 'stacked' (goals across the top, list full width) or
 * 'sidebar' (goals stay beside the list while scrolling).
 */
export type GoalsLayout = 'stacked' | 'sidebar'

/** How the This week tab shows issues. */
export type IssuesView = 'list' | 'board'

interface PreferencesState {
  goalsLayout: GoalsLayout
  /** The project opened last, for a quicker way back. */
  lastProjectId: string | null
  /** The view this person chose last; a link with `?view=` wins over it. */
  issuesView: IssuesView

  setGoalsLayout: (layout: GoalsLayout) => void
  setLastProjectId: (projectId: string | null) => void
  setIssuesView: (view: IssuesView) => void
}

/** Per-person choices, kept across visits (localStorage). Survives sign-out. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      goalsLayout: 'stacked',
      lastProjectId: null,
      issuesView: 'list',
      setGoalsLayout: (goalsLayout) => set({ goalsLayout }),
      setLastProjectId: (lastProjectId) => set({ lastProjectId }),
      setIssuesView: (issuesView) => set({ issuesView }),
    }),
    {
      name: 'trakr.preferences',
      version: 2,
      storage: localJSONStorage,
      partialize: ({ goalsLayout, lastProjectId, issuesView }) => ({ goalsLayout, lastProjectId, issuesView }),
      // v1 → v2 added issuesView. Anything unknown falls back to the defaults.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PreferencesState>
        return (version < 2 ? { ...state, issuesView: 'list' } : state) as PreferencesState
      },
    },
  ),
)
