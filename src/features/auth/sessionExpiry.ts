/**
 * Remembers that the session ended mid-use (an API call returned 401), so the
 * sign-in page can say "Your session expired" instead of a plain sign-in.
 */
let expired = false

export function markSessionExpired(): void {
  expired = true
}

/** Read and clear the flag. */
export function consumeSessionExpired(): boolean {
  const was = expired
  expired = false
  return was
}
