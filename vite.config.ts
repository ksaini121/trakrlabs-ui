/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

/** Backend paths the dev server forwards to FastAPI. None clash with app routes (`/projects` is plural). */
const API_PATHS = ['/auth', '/project', '/issue', '/health']

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Same origin for the app and the API in development: no CORS, and the
      // session cookie set by /auth/github/callback belongs to localhost:5173.
      proxy: Object.fromEntries(
        API_PATHS.map((path) => [
          path,
          {
            target,
            changeOrigin: false,
            // `/projects…` is a frontend route; only proxy `/project` and `/project/…`.
            bypass: (req: { url?: string }) =>
              path === '/project' && req.url && /^\/projects(\/|$|\?)/.test(req.url) ? req.url : undefined,
          },
        ]),
      ),
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
