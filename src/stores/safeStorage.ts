import { createJSONStorage, type StateStorage } from 'zustand/middleware'

/**
 * Browser storage that never throws. Private windows, blocked site data and
 * sandboxed previews can make storage unavailable; persisted stores then simply
 * last for the page's lifetime.
 */
function safe(getStorage: () => Storage): StateStorage {
  const run = <T>(fn: (storage: Storage) => T, fallback: T): T => {
    try {
      return fn(getStorage())
    } catch {
      return fallback
    }
  }
  return {
    getItem: (name) => run((s) => s.getItem(name), null),
    setItem: (name, value) => run((s) => s.setItem(name, value), undefined),
    removeItem: (name) => run((s) => s.removeItem(name), undefined),
  }
}

export const sessionJSONStorage = createJSONStorage(() => safe(() => window.sessionStorage))
export const localJSONStorage = createJSONStorage(() => safe(() => window.localStorage))
