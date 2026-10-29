# Trakr frontend

React 19 + TypeScript + Vite. Implements the Trakr Labs v1 design (Organic design system):
sign in, projects, create project, invite team, first sync and the weekly dashboard, wired to
the FastAPI backend.

```bash
npm install
cp .env.example .env.local   # optional; the defaults work for local development
npm run dev                  # http://localhost:5173, API proxied to http://localhost:8000
npm run dev:mocks            # same app on the in-browser mock backend (no API needed)
npm run build                # type-check + production build
npm run lint
npm test                     # Vitest: mappers, error parsing, list filters
npm run api:types            # regenerate src/api/schema.d.ts from the running API's /openapi.json
npm run todo:api             # every value still waiting for the API
```

## How data flows

```
page → feature hook (TanStack Query) → service (src/api/services) → http() → FastAPI
                                                   ↓
                                   mapper (src/api/mappers.ts): API shape → app type
```

- **Server data** lives only in TanStack Query. Every key is in `src/api/queryKeys.ts`
  (`['projects','list']`, `['projects','detail',id,'members']`…).
- **Client state** lives in Zustand (`src/stores`): which popup is open, the create-project
  flow (kept for the browser tab), preferences (kept across visits) and toasts.
- **URL state:** the dashboard tab and filters live in the query string, so views can be shared.
- **Components never see API field names.** `schema.d.ts` is generated, `dto.ts` names its
  shapes, and `mappers.ts` turns them into the types in `src/types/domain.ts`.

## Local development with the API

- The Vite dev server proxies `/auth`, `/project`, `/issue` and `/health` to `API_PROXY_TARGET`
  (default `http://localhost:8000`), so the app and API share one origin and the session cookie
  just works. Leave `VITE_API_URL` empty in development.
- GitHub OAuth app for development: callback URL `http://localhost:5173/auth/github/callback`
  (it goes through the proxy), and the backend's frontend URL set to `http://localhost:5173`.
- Sign-in is a full-page navigation to `/auth/github/login?next=…`; the backend redirects back
  to `next`, or to `/sign-in?auth_error=cancelled|failed`.
- Production: set `VITE_API_URL` (e.g. `https://api.trakrlabs.com`) and allow the frontend
  origin with credentials on the API.

## What isn't from the API yet

Every placeholder is in `src/api/placeholders.ts`, flagged `TODO(api)`; `npm run todo:api` lists
them. When an endpoint or field ships: run `npm run api:types`, update the mapper, delete the
placeholder, and fix whatever TypeScript points at.

- **Goals** are kept in the browser tab (marked "Preview" on the dashboard).
- **AI ranking** (reasons, goal groups, Open PR, Needs detail) is off; "This week" lists every
  open issue, newest activity first, with Stalled and Unassigned filters.
- **Linked issues** show sample data, marked "Preview".
- **Project cards** hide member avatars and show the created date instead of the last sync.
- Screens for endpoints that don't exist (token check, replace token, accept invite) are kept
  in `_parked/`, outside the build.

## Mock mode

`npm run dev:mocks` (or `VITE_USE_MOCKS=true`) answers every call from `src/mocks/backend.ts`,
which speaks the same JSON as FastAPI, so services and mappers run exactly as they do live.
It's never included in production builds. Error states you can trigger are listed at the top
of that file.

## Structure

```
src/
  app/          Providers, router, typed paths, query client
  api/          Everything that knows about the backend: client, errors, query keys,
                schema.d.ts (generated), dto.ts, mappers, placeholders, services/
  stores/       Zustand stores (client state only)
  mocks/        Mock backend (FastAPI-shaped) + preview data for goals and links
  types/        The app's own domain types
  components/
    ui/         Reusable building blocks: Button, Tag, Avatar, Dialog, Menu, Banner, Field, Toaster…
    layout/     App shell: header, layout, status card, page loader
  features/     Feature modules: data hooks + feature components
    auth/ projects/ invites/ goals/ issues/ links/ dashboard/
  pages/        One component per route; composes features
  hooks/        Generic hooks
  lib/          Pure helpers (dates, people, class names)
  styles/       organic.css (design system, unchanged) + global.css
```

## Board view

"This week" has two views, switched with List | Board: the list (default) and a read-only
board grouped by Status, Person or Goal. The view and grouping live in the URL
(`?view=board&group=person`), and each person's last choice is remembered.

- Grouping rules are pure functions in `src/features/issues/board.ts` (tested in `board.test.ts`).
- Components are in `src/features/board/`; both views share `IssueToolbar` and `IssueMeta`.
- There's no drag-and-drop: columns come from the issue's data, since Trakr never writes to GitHub.
- "Closed this week" makes one extra `GET /issue?state=closed` request, only while the status
  board is open. "In review" and Group by Goal need AI data, so they only appear in mock mode for now.

## Dashboard layout

The design has two dashboard layouts, stored per person in `usePreferencesStore`
(`goalsLayout: 'stacked' | 'sidebar'`). Stacked is the default; there's no switch in the UI yet.
