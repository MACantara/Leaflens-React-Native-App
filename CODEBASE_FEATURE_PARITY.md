# Codebase Feature Parity

Date: 2026-04-07

## Scope
This document compares current parity between:
- Original Java backend in `src/main/java/leaf/ai/Leaflens`
- New TypeScript backend in `typescript-backend/src`
- React Native app in `react-native-app/src`

Baseline source for required behavior: `CORE_FUNCTIONALITY_LIST.md` plus Java controllers/security configuration.

## Parity Matrix

| Capability | Java Backend (Baseline) | TypeScript Backend | React Native App | Parity Status |
|---|---|---|---|---|
| Authentication (register, login, validate) | Implemented | Implemented (`auth.ts`) | Implemented (`AuthScreen.tsx`) | Full |
| User profile CRUD (get/update/delete user) | Implemented | Implemented (`user.ts`) | No profile UI/actions | Partial |
| Analyze image without save (`/leaf-analyzer/analyze`) | Implemented | Implemented (`leafAnalyzer.ts`) | Implemented (`AnalyzeScreen.tsx`) | Full |
| Analyze and save (`/leaf-analyzer/analyze-save/:userId`) | Implemented | Implemented (`leafAnalyzer.ts`) | Implemented (`AnalyzeScreen.tsx`) | Full |
| Manual save flow (`/leaf-history/save/{userId}`) | Implemented in Java (`LeafCollectionController`) | Not implemented | Not implemented | Missing |
| Get user leaf history | Implemented | Implemented (`leafHistory.ts`) | Implemented (`CollectionScreen.tsx`, `HistoryScreen.tsx`) | Full |
| Get single leaf details | Implemented | Implemented (`leafHistory.ts`) | No dedicated call/use of endpoint | Partial |
| Get leaf image bytes | Implemented | Implemented (`leafHistory.ts`) | Implemented (image URLs in collection/explore) | Full |
| Delete leaf | Implemented | Implemented (`leafHistory.ts`) | No delete UI/action | Partial |
| Get per-user leaf count | Implemented | Implemented (`leafHistory.ts`) | No UI/use | Partial |
| Explore leaves + keyword search | Implemented | Implemented (`leaves.ts`) | Implemented (`ExploreScreen.tsx`) | Full |
| Save explored/public leaf to collection | Implemented | Implemented (`leaves.ts`) | Implemented (`ExploreScreen.tsx`) | Full |
| Search user history by keyword + tags | Implemented | Implemented (`leafHistory.ts`) | Not surfaced in UI | Partial |
| Tag discovery by user | Implemented | Implemented (`tags.ts`) | API exists but no UI usage | Partial |
| Leaf references retrieval | Implemented | Implemented (`leafReferences.ts`) | API exists but no UI usage | Partial |
| AI output tags/references schema | Implemented | Implemented (`aiAnalyzer.ts`) | Result card does not display tags/references | Partial |
| Location-based Cavite enrichment (`isGrownInCavite` from curated dataset) | Implemented via services + dataset | Prompt-derived only; no dataset/registry enrichment | Field not shown in UI | Partial |

## Major Gaps To Reach Strong Parity

### 1) Missing Java manual-save endpoint behavior
- Java has: `POST /api/v1/leaf-history/save/{userId}` for manual save of submitted analysis payload.
- TypeScript backend does not currently expose equivalent behavior.
- Impact: parity gap for clients that need explicit non-AI save workflow.

### 2) Mobile app does not expose several backend-complete capabilities
Backend endpoints exist in TypeScript, but UI does not expose them:
- User profile management (view/update/delete)
- Delete leaf from history/collection
- Leaf count usage
- Search + tag filtering in personal history
- Tag discovery UI
- Leaf references viewing UI
- Tags/references/isGrownInCavite rendering in detail screens

### 3) Cavite enrichment logic mismatch
- Java baseline enriches with deterministic local dataset/registry (`cavite-plants.txt` + location services).
- TypeScript backend currently trusts model output for `isGrownInCavite`.
- Impact: behavior can differ from Java for same plant input.

### 4) Security behavior differs on selected routes
Compared to Java security defaults, TypeScript currently allows more public access for some routes (notably `GET /api/v1/leaves/explore` and `GET /api/v1/leaf-history/leaf/:leafId/image`).
If strict behavioral parity with Java security policy is required, these should be aligned.

## Recommended Parity Backlog (Priority Order)

1. Implement TypeScript equivalent of Java manual-save route (`/api/v1/leaf-history/save/:userId`) and wire tests.
2. Add Cavite dataset-based enrichment service in TypeScript and apply post-analysis normalization.
3. Add mobile history search + tag filter UI using existing `searchUserLeaves` and `getUserTags` APIs.
4. Add mobile leaf detail references section using `getLeafReferences`.
5. Add mobile delete-leaf actions from history/collection.
6. Add profile screen for get/update/delete user operations.
7. Align security policy with Java baseline where required for protected resources.
8. Surface `tags`, `references`, and `isGrownInCavite` in Analyze/Collection detail cards.

## Overall Parity Summary

- TypeScript backend parity vs Java backend: **High but not complete**.
  - Most core endpoint groups are implemented.
  - Main backend functional deltas are manual-save parity and deterministic Cavite enrichment parity.
- React Native parity vs original full capability set: **Moderate**.
  - Core end-user flows (auth, analyze-save, explore, collection/history viewing) work.
  - Several advanced/management features already available in backend are not yet exposed in UI.
