## Copilot / AI Agent Instructions

Purpose: help AI coding agents be productive quickly in this React + TypeScript + Vite codebase.

- **Big picture:** This is a small SPA that analyzes weekend weather for a set of cities and surfaces ride recommendations. UI is React + TypeScript; builds with Vite. Weather analysis and business logic live in `services/` and the UI composes the results in `components/`.

- **Key files:**
  - **App root:** [App.tsx](../App.tsx) — orchestrates data loading, batching and shows `SummaryView` / `CityDetail`.
  - **Weather logic:** [services/weatherService.ts](../services/weatherService.ts) — core analysis: `analyzeCity`, `getWeekendDates`, data slicing and clothing rules.
  - **Places / POI lookup:** [services/placesService.ts](../services/placesService.ts) — Overpass API usage, results filtering and simple cache.
  - **Constants & city list:** [constants.ts](../constants.ts) — `CITIES`, `CITY_FILENAMES`, `API_URL`, `FLIGHT_CITIES`, and curated `CITY_PLACES`.
  - **Components:** [components/SummaryView.tsx](../components/SummaryView.tsx), [components/CityDetail.tsx](../components/CityDetail.tsx) — show the analyzed results and route links.

- **Data flow & boundaries:**
  - City coordinates are read from `constants.ts` (`CITIES`) and iterated in `App.tsx`.
  - `App.tsx` batches requests and calls `analyzeCity(name, coords, dates)` from `weatherService`.
  - `weatherService` queries Open-Meteo using `API_URL`, transforms hourly arrays into per-day `WeatherDayStats`, computes clothing hints and calls `checkRouteAvailability()` which attempts to fetch static GPX files under `public/routes/`.
  - When UI needs nearby venues, it calls `fetchNearbyPlaces()` in `placesService` which posts an Overpass query and applies project-specific filters (excludes malls, unnamed entries).

- **Important patterns / conventions:**
  - Time handling: dates are normalized to local noon in `getWeekendDates()` to avoid timezone shifts — follow that pattern when adding new date logic.
  - Hourly arrays are sliced using fixed offsets (24 hours per day). When indexing into `hourly.*`, compute offsets relative to the `targetDates` passed to `analyzeCity` to avoid cross-browser parsing issues.
  - GPX route files are named using `CITY_FILENAMES` + wind cardinal (see `getCardinal`) under `public/routes/` — `checkRouteAvailability()` does GET requests and tolerates missing files.
  - UI assumes `analyzeCity` returns `null` on API failure; `App.tsx` filters out `null` results and continues.
  - Caching: `placesService` keeps a simple in-memory cache keyed by rounded coords to avoid repeated Overpass calls.

- **Build & dev commands** (from `package.json`):

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # TypeScript check + vite build
npm run preview    # preview built site
```

- **Testing / debugging tips specific to this repo:**
  - Network/API: `weatherService` uses Open-Meteo and may fail silently; inspect browser DevTools network tab for failed fetch and look at returned JSON shape.
  - Static GPX debugging: files live in `public/routes/` — test requests to e.g. `/routes/Moscow_N.gpx` in the browser to verify availability.
  - Overpass: `placesService` sends a POST to `https://overpass-api.de/api/interpreter`. For rate limits, use the cache or mock responses during development.

- **What to change carefully / common pitfalls:**
  - Avoid changing the date-normalization pattern in `getWeekendDates()` — many calculations rely on 12:00 local-time anchoring.
  - `weatherService` assumes hourly arrays align with requested date range; do not refactor indexing without validating with real API responses.
  - When editing clothing logic (`getClothingRecommendations`), prefer small, well-tested changes — results feed UI directly.

- **Examples of quick PRs an AI agent might make:**
  - Add a small defensive null-check when reading `hourly.*` arrays in `analyzeCity` (show example in PR).
  - Improve GPX fetch to use `HEAD` first to avoid downloading large files, or add a small retry/backoff for transient network errors.
  - Add unit tests around `getWeekendDates()` and `getCardinal()` using sample dates/angles.

If anything is unclear or you'd like me to include specific code snippets or tests in the instructions, tell me which areas to expand.
