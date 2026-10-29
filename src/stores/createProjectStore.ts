import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sessionJSONStorage } from './safeStorage'

export interface ProjectDraft {
  name: string
  /** As typed: "owner/repo" or a GitHub URL. */
  repo: string
  description: string
}

/** Create project is three steps: details → invite → first sync. */
export type CreateProjectStep = 'details' | 'invite'

interface CreateProjectState {
  draft: ProjectDraft
  step: CreateProjectStep
  /** Set once the project exists, so a refresh during step 2 returns to it. */
  created: { id: string; name: string } | null

  updateDraft: (changes: Partial<ProjectDraft>) => void
  projectCreated: (project: { id: string; name: string }) => void
  reset: () => void
}

const initial = {
  draft: { name: '', repo: '', description: '' },
  step: 'details' as CreateProjectStep,
  created: null,
}

/**
 * The create-project flow, kept for the browser tab (sessionStorage): a refresh
 * mid-onboarding returns to the same step instead of a blank form.
 */
export const useCreateProjectStore = create<CreateProjectState>()(
  persist(
    (set) => ({
      ...initial,
      updateDraft: (changes) => set((s) => ({ draft: { ...s.draft, ...changes } })),
      projectCreated: (created) => set({ created, step: 'invite' }),
      reset: () => set(initial),
    }),
    {
      name: 'trakr.create-project',
      version: 1,
      storage: sessionJSONStorage,
      partialize: ({ draft, step, created }) => ({ draft, step, created }),
    },
  ),
)
