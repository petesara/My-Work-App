# My Work App — ATS (Applicant Tracking System)

## ⚠️ IMPORTANT: Do NOT read `historical_data.json`
This file is ~7.7 MB / 288 000 lines of raw candidate records. It is intentionally
gitignored and kept on disk only for one-time import via the app UI.
**Never open, cat, grep, or include it in any search.** Doing so will exhaust the
context window and freeze the session.

## Stack
- **Frontend**: React 18 + Vite 6 + Zustand + Tailwind CSS (via PostCSS)
- **Backend**: Cloudflare Worker (`worker/index.js`) + Cloudflare D1 (SQLite)
- **Deploy**: `wrangler` — see `wrangler.jsonc`
- **Language**: JavaScript (no TypeScript)

## Project layout
```
src/
  App.jsx              — routing, auth guard, server init
  main.jsx             — React entry point
  store/useStore.js    — Zustand store; all shared state + API calls
  data/
    offices.js         — OFFICES list, CHARITIES, SOURCES, STATUSES constants
    translations.js    — EN/FR string map
  components/
    Layout.jsx / Sidebar.jsx / Header.jsx
    AddCandidatePanel.jsx  — slide-in panel for add/edit
    Toast.jsx / StatusBadge.jsx / BrandLogo.jsx
  pages/
    Landing.jsx        — role selector
    Pipeline.jsx       — main candidate table
    OnboardingTracker.jsx
    ManagerDirectory.jsx
    Reports.jsx
    DoNotHire.jsx
    UserProfiles.jsx
    Calendar.jsx
    HistoricalRecords.jsx — read-only view of imported historical candidates
    ImportModal.jsx    — CSV paste import + historical JSON import tab
worker/
  index.js             — Cloudflare Worker: REST API for /api/candidates and /api/dnh
migrations/            — D1 SQL migrations
```

## Data flow
- On app load, `initializeFromServer()` fetches `/api/candidates` and `/api/dnh` from D1.
- Mutations go through `useStore` actions which update state optimistically and fire
  fire-and-forget `fetch()` calls to sync to D1.
- User preferences (role, language, assigned offices) stay in `localStorage`.

## Dev commands
```bash
npm run dev      # Vite dev server (frontend only — no Worker)
npm run build    # Production build → dist/
```
To run the Worker locally use `wrangler dev`.

## Key files to understand a bug
- Store logic: `src/store/useStore.js`
- API routes: `worker/index.js`
- Candidate shape: defined inline in `useStore.js` and `src/pages/Pipeline.jsx`
