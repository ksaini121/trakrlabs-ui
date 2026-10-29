import { create } from 'zustand'

export type ToastTone = 'success' | 'error'

export interface ToastMessage {
  id: number
  message: string
  tone: ToastTone
}

interface ToastState {
  toast: ToastMessage | null
  show: (message: string, tone?: ToastTone) => void
  dismiss: () => void
}

let nextId = 0

/** The current toast. A store (not context) so non-React code, like the query client, can show one. */
export const useToastStore = create<ToastState>()((set) => ({
  toast: null,
  show: (message, tone = 'success') => {
    nextId += 1
    set({ toast: { id: nextId, message, tone } })
  },
  dismiss: () => set({ toast: null }),
}))

/** Show a toast from anywhere: `toast.show('Goals saved')`, `toast.error('Couldn't save')`. */
export const toast = {
  show: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
}
