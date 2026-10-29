/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** FastAPI base URL. Empty in development (the Vite proxy serves the API on the same origin). */
  readonly VITE_API_URL?: string
  /** "true" runs the app on the in-browser mock backend. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
