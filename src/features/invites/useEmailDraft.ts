import { useState } from 'react'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export interface EmailDraft {
  chips: string[]
  draft: string
  error: string | null
  setDraft: (value: string) => void
  setError: (message: string | null) => void
  removeChip: (email: string) => void
  /** Replace the chips, e.g. keep only the emails the server turned down. */
  setChips: (emails: string[]) => void
  /** Turn the typed text into chips. Returns the full list, or null if something is invalid. */
  commit: () => string[] | null
  clear: () => void
}

/** State for an "emails as chips" input: typed text, accepted chips and a validation error. */
export function useEmailDraft(): EmailDraft {
  const [chips, setChips] = useState<string[]>([])
  const [draft, setDraftState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const commit = (): string[] | null => {
    const parts = draft
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter(Boolean)
    const invalid = parts.find((part) => !EMAIL.test(part))
    if (invalid) {
      setError(`“${invalid}” isn’t a valid email address.`)
      return null
    }
    const next = [...chips, ...parts.filter((part) => !chips.includes(part))]
    setChips(next)
    setDraftState('')
    setError(null)
    return next
  }

  return {
    chips,
    draft,
    error,
    setDraft: (value) => {
      setDraftState(value)
      setError(null)
    },
    setError,
    removeChip: (email) => setChips((list) => list.filter((e) => e !== email)),
    setChips,
    commit,
    clear: () => {
      setChips([])
      setDraftState('')
      setError(null)
    },
  }
}
