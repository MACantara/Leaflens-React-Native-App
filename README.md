
# LeafLens Monorepo

LeafLens is a mobile-first plant analysis and collection system focused on practical plant identification, educational context, and searchable medicinal-use metadata.

This monorepo contains:
- React Native mobile client in `react-native-app`
- TypeScript backend API in `typescript-backend`
- Archived legacy Java implementation in `legacy-java-mobile-app`

## Table of contents

- [System purpose](#system-purpose)
- [Architecture at a glance](#architecture-at-a-glance)
- [Repository map](#repository-map)
- [Core user journeys](#core-user-journeys)
- [Quick start](#quick-start)
- [Command reference](#command-reference)
- [Presentation preparation guide](#presentation-preparation-guide)
- [Demo script (recommended)](#demo-script-recommended)
- [Potential panel questions and answers](#potential-panel-questions-and-answers)
- [Troubleshooting quick wins](#troubleshooting-quick-wins)
- [Deployment and release](#deployment-and-release)

Supplemental docs:
- [Presentation knowledge base](PRESENTATION_KNOWLEDGE_BASE.md)
- [Mobile presentation guide](react-native-app/PRESENTATION_GUIDE.md)
- [Backend presentation guide](typescript-backend/docs/presentation-guide.md)

## System purpose

LeafLens helps users:
- Capture or upload a leaf image.
- Receive structured plant analysis (identity, traits, habitat, care, safety).
- Review medicinal relevance and condition-oriented associations (when available).
- Save plants to personal collection and explore public shared plants.
- Search by name, use, tags, and condition terms.

## Architecture at a glance

<img width="591" height="412" alt="leaflens_AI drawio" src="https://github.com/user-attachments/assets/2c5a6084-c809-4dab-b341-a54d029c5655" />

High-level runtime flow:
1. Mobile app captures image and sends multipart request to backend.
2. Backend normalizes image, calls AI analysis service, enriches and validates output.
3. Backend stores analysis and image metadata in MongoDB + object storage (when saved).
4. Mobile app renders results with consistent status/empty/progress UI.

## Repository map

| Path | Purpose | Active status |
| --- | --- | --- |
| `react-native-app/` | Mobile app (Expo + React Native + TypeScript) | Active |
| `typescript-backend/` | API service (Express + TypeScript + MongoDB) | Active |
| `legacy-java-mobile-app/` | Historical Java implementation and old infra files | Archived |
| `CODEBASE_FEATURE_PARITY.md` | Legacy-to-new feature parity tracker | Reference |
| `CORE_FUNCTIONALITY_LIST.md` | Core feature inventory checklist | Reference |
| `TECH_STACK_ANALYSIS.md` | Legacy stack analysis and migration context | Reference |

## Core user journeys

1. Analyze then save
- User captures leaf image in Analyze.
- App calls `/api/v1/leaf-analyzer/analyze-save/:userId`.
- Backend returns structured analysis and persistence metadata.
- User sees result details and can later reopen from collection/history.

2. Explore and condition search
- User opens Explore or global search overlay.
- Search supports keyword + tag logic, and condition terms.
- User can save public plants to personal collection.

3. Profile and account lifecycle
- User views/updates profile.
- User can delete account with confirmation flow.

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB
- Android Studio + Android SDK for Android builds
- Optional AI key from Google AI Studio

### Start backend

```bash
cd typescript-backend
npm install
cp .env.example .env
npm run dev
```

Health check:

```bash
curl http://localhost:8080/health
```

### Start mobile app

```bash
cd react-native-app
npm install
cp .env.example .env
```

Set:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Run:

```bash
npm run android
```

Important:
- Run mobile commands inside `react-native-app`.
- Run backend commands inside `typescript-backend`.

## Command reference

### Backend commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Watch-mode API run |
| `npm run typecheck` | Strict TS checks |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled service |
| `npm run images:backfill-1080p` | Normalize images to 1080p WebP |
| `npm run db:migrate:delete-non-applicable-leaves` | Clean invalid analysis records |
| `npm run db:migrate:remove-ai-references` | Remove legacy AI references data |
| `npm run db:migrate:backfill-image-visibility` | Backfill owner and sharing fields |
| `npm run db:wipe:plants -- --force` | Wipe plant records and related images |

### Mobile commands

| Command | Purpose |
| --- | --- |
| `npm run android` | Dev Client run on Android |
| `npm run start` | Start Expo server |
| `npm run start:dev` | Start Expo with clean cache |
| `npm run typecheck` | Strict TS checks |
| `npm run build:apk-local` | Clean local release APK build |
| `npm run build:apk-local:fast` | Faster local release build |
| `npm run build:apk-local:gradle` | Fastest rebuild for JS/TS-only edits |

## Presentation preparation guide

### 24 hours before presentation

1. Validate backend environment values (`MONGODB_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, storage keys if needed).
2. Run backend and mobile typechecks.
3. Ensure at least one account has a representative plant collection.
4. Confirm Android demo device can reach backend URL in app `.env`.

### 30 minutes before presentation

1. Start backend and verify `/health`.
2. Launch app and test login, analyze, save, explore search.
3. Prepare fallback screenshots in case of unstable network.
4. Keep one known-good leaf sample image ready.

### Presenter talking points

- Why this architecture: rapid iteration in TypeScript across mobile and backend.
- AI safety stance: guidance text includes caution language and applicability checks.
- Reliability strategy: centralized status and empty state components improve clarity.
- Search UX: keyword, tag, and condition semantics are handled explicitly.

## Demo script (recommended)

1. Login and show clean startup.
2. Analyze a leaf and explain confidence + medicinal fields.
3. Save result and open collection.
4. Open global search overlay and search a condition term.
5. Show Explore and tag-driven narrowing.
6. Open plant details and redirect via tag/condition chips.
7. Show profile update and account safety actions.

## Potential panel questions and answers

### Product and UX

Q: How do users trust analysis results?
A: The app surfaces confidence labels, safety notes, and structured identification notes. It avoids presenting output as medical diagnosis.

Q: What happens when no data is available?
A: The UI uses centralized empty-state cards with icon, title, and actionable description to reduce ambiguity.

### Technical

Q: Why monorepo?
A: Shared TypeScript-first workflow, synchronized evolution of contracts, and easier release coordination.

Q: How do you handle search reliability if backend versions differ?
A: The app includes local filtering support for keyword/tag/condition fields to keep search behavior resilient.

Q: How are large images handled?
A: Backend normalization resizes/transcodes before analysis/storage to bound payload and rendering costs.

### Operations

Q: What is the fastest way to prepare demo APK?
A: Run `npm run build:apk-local:gradle` in `react-native-app` when only JS/TS changed.

Q: Why did npm fail with package.json not found?
A: Command executed from repository root instead of target package folder.

## Troubleshooting quick wins

1. Build command fails with package.json missing
- Check current directory and rerun in `react-native-app` or `typescript-backend`.

2. App cannot call backend from physical phone
- Set `EXPO_PUBLIC_API_BASE_URL` to reachable LAN/public host, not localhost.

3. Android Java compatibility errors
- Use JDK 17 or 21 and rerun `npm run android`.

4. Dev Client opens but no data appears
- Confirm backend URL, auth token validity, and network connectivity.

5. Search returns nothing unexpectedly
- Clear conflicting tags, then test with broad keyword and known dataset.

## Deployment and release

- Backend deployment guide: [typescript-backend/docs/railway-deployment.md](typescript-backend/docs/railway-deployment.md)
- Backend documentation: [typescript-backend/README.md](typescript-backend/README.md)
- Mobile documentation: [react-native-app/README.md](react-native-app/README.md)
- APK workflow: [.github/workflows/android-apk-release.yml](.github/workflows/android-apk-release.yml)

## Legacy archive note

`legacy-java-mobile-app/` is reference-only and not part of active runtime.

Active development targets:
- `react-native-app/`
- `typescript-backend/`
   
