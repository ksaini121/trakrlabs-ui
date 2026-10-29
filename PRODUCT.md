# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A whole small team (engineers and their lead) that works out of GitHub. Each person opens Trakr at the start of the week to see what to work on, how it ties to the team's goals, and what teammates are doing. Sign-in is via GitHub OAuth; projects have members who can be invited.

## Product Purpose

Trakr Labs turns a team's GitHub issues into a weekly focus: "Know what to work on this week." It shows the weekly dashboard (This week list and board, goals, linked issues) for a project after a first sync. Success is a team that opens it on Monday and knows what matters without a planning meeting.

## Positioning

AI-ranked weekly focus. Trakr ranks open issues against the team's goals and explains why, while staying read-only toward GitHub. A tracker that writes back or relies on manual triage cannot truthfully claim this.

## Operating Context

Used at the start of the week and checked through it. Data comes from the FastAPI backend (GitHub-synced issues, projects, members). The create-project flow ends in a first sync. Dashboard state (tab, filters, board view and grouping) lives in the URL so views can be shared.

## Capabilities and Constraints

- Trakr never writes to GitHub; the board is read-only (no drag-and-drop), columns derive from issue data.
- Board groups by Status, Person or Goal; List | Board toggle.
- Goals are currently browser-tab-only and marked "Preview"; linked issues show sample data marked "Preview".
- AI ranking (reasons, goal groups, Open PR, Needs detail) is off pending the API; "This week" lists open issues by recent activity with Stalled and Unassigned filters.
- Screens for missing endpoints (token check, replace token, accept invite) are parked in `_parked/`.
- Stack: React 19, TypeScript, Vite, TanStack Query, Zustand, React Router; mock backend via `npm run dev:mocks`.

## Brand Commitments

Name: Trakr Labs. The Organic design system (`src/styles/organic.css`) is the binding visual commitment for v1.

## Evidence on Hand

Mock and preview data in `src/mocks/` only. No real customers, testimonials or metrics exist; do not fabricate any.

## Product Principles

- Honest about what is real: anything not backed by the API is labelled "Preview".
- Read-only toward GitHub; Trakr observes and ranks, never mutates.
- Weekly focus over exhaustive tracking: show what matters this week first.
- Explain the ranking; AI output carries its reasons.
- Shareable state: views live in the URL.

## Accessibility & Inclusion

WCAG AA.
