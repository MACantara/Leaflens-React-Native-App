# Codebase Feature Parity

Date: 2026-04-07 (revalidated)

## Scope
This document compares current parity between:
- Original Java implementation in `src/main/java/leaf/ai/Leaflens` (+ security config)
- TypeScript backend in `typescript-backend/src`
- React Native app in `react-native-app/src`

Baseline source for required behavior: `CORE_FUNCTIONALITY_LIST.md` plus Java controllers/security configuration.

## Revalidation Notes
- This file was rechecked against current code.
- Several previously marked gaps are now implemented in both the TypeScript backend and the React Native UI.

## Parity Matrix

| Capability | Java Baseline | TypeScript Backend | React Native App | Parity Status |
|---|---|---|---|---|
| Authentication (register, login, validate) | Implemented (`AuthenticationController`) | Implemented (`routes/auth.ts`) | Register/login flow implemented (`screens/AuthScreen.tsx`), validate API available (`api/auth.ts`) | Full |
| User profile CRUD (get/update/delete) | Implemented (`UserController`) | Implemented (`routes/user.ts`) | Implemented (`screens/ProfileScreen.tsx`) | Full |
| Analyze image without save (`POST /leaf-analyzer/analyze`) | Implemented | Implemented (`routes/leafAnalyzer.ts`) | Implemented (`screens/AnalyzeScreen.tsx`) | Full |
| Analyze and save (`POST /leaf-analyzer/analyze-save/:userId`) | Implemented | Implemented (`routes/leafAnalyzer.ts`) | Implemented (`screens/AnalyzeScreen.tsx`) | Full |
| Manual save flow (`POST /leaf-history/save/{userId}`) | Implemented (`LeafCollectionController`) | Implemented (`routes/leafHistory.ts`) | No dedicated manual-save UI/form flow | Partial |
| Get user leaf history | Implemented | Implemented (`routes/leafHistory.ts`) | Implemented (`screens/CollectionScreen.tsx`, `screens/HistoryScreen.tsx`) | Full |
| Get single leaf details (`GET /leaf-history/leaf/:leafId`) | Implemented | Implemented (`routes/leafHistory.ts`) | No dedicated endpoint call; details mostly from already loaded list item | Partial |
| Get leaf image bytes | Implemented | Implemented (`routes/leafHistory.ts`) | Implemented (`api/leaves.ts` image source + usage in screens) | Full |
| Delete leaf | Implemented | Implemented (`routes/leafHistory.ts`) | Implemented (`screens/CollectionScreen.tsx`, `screens/HistoryScreen.tsx`) | Full |
| Get per-user leaf count | Implemented | Implemented (`routes/leafHistory.ts`) | Implemented (`screens/HistoryScreen.tsx`) | Full |
| Explore leaves + keyword search | Implemented (`LeafExploreController`) | Implemented (`routes/leaves.ts`) | Implemented (`screens/ExploreScreen.tsx`) | Full |
| Save explored/public leaf to collection | Implemented | Implemented (`routes/leaves.ts`) | Implemented (`screens/ExploreScreen.tsx`) | Full |
| Search user history by keyword + tags | Implemented (`LeafCollectionController`) | Implemented (`routes/leafHistory.ts`) | Implemented (`screens/CollectionScreen.tsx`) | Full |
| Tag discovery by user | Implemented (`TagController`) | Implemented (`routes/tags.ts`) | Implemented (`screens/CollectionScreen.tsx`) | Full |
| Leaf references retrieval | Implemented (`LeafReferenceController`) | Implemented (`routes/leafReferences.ts`) | Implemented in collection details (`screens/CollectionScreen.tsx`) | Full |
| AI output tags/references schema | Implemented | Implemented (`services/aiAnalyzer.ts`) | Displayed in analysis result (`screens/AnalyzeScreen.tsx`) | Full |
| Location-based Cavite enrichment (`isGrownInCavite`) | Deterministic dataset + registry/service pattern | Deterministic dataset-based matching (`services/cavitePlants.ts`) with model fallback | Displayed in analyze/collection details | Partial (functionally close, architecture differs) |
| Security posture for protected routes | Auth required except auth + analyze | Auth required on equivalent route groups (auth + analyze public; others protected) | Sends bearer token on protected calls | Full |

## Remaining Gaps To Reach Strict Parity

### 1) Manual-save mobile UX is still missing
- Backend parity exists for `POST /api/v1/leaf-history/save/:userId`.
- React Native app currently relies on analyze-and-save flow, not separate manual payload entry/save UI.

### 2) Single-leaf detail endpoint is not explicitly consumed in mobile
- Endpoint parity exists in backend.
- Mobile details are primarily rendered from list payloads, not from `GET /leaf-history/leaf/:leafId`.

### 3) Cavite enrichment architecture differs from Java baseline
- Java uses a location-service registry pattern + `cavite-plants.txt`.
- TypeScript uses local dataset matching (`cavite-plants.json`) with fallback to model signal.
- Behavior is close, but implementation architecture is not one-to-one.

## Recommended Final Parity Backlog

1. Add optional manual-save UI flow in React Native if this user journey is still required.
2. Optionally call single-leaf detail endpoint when opening collection detail view (for strict API parity and freshest data).
3. If architectural parity is required, add registry-style location service abstraction to TypeScript backend (current functional behavior is already close).

## Archive Readiness (Java Code)

Verdict: **Yes, you can move Java sources to an archive folder** once you complete a quick safety gate.

Suggested archive target:
- `legacy-java-mobile-app/` (or more precisely `legacy-java-backend/` if this is server code)

Safety gate before moving:
1. Confirm all production traffic is routed to `typescript-backend`.
2. Preserve Java code history (keep git history; avoid deleting from git history).
3. Keep baseline docs (`CORE_FUNCTIONALITY_LIST.md`, this file) referencing archived paths.
4. Run smoke tests on TypeScript backend + React Native critical flows after move.

## Overall Parity Summary

- TypeScript backend parity vs Java baseline: **Very high** (core feature set implemented).
- React Native parity vs baseline feature set: **High** (major previous UI gaps now implemented).
- Remaining differences are mostly strict/structural parity concerns, not major missing user-critical capabilities.
