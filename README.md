
# LeafLens Monorepo

LeafLens is a mobile-first plant identification app with:
- A React Native (Expo) client in `react-native-app`
- A TypeScript/Node.js API in `typescript-backend`

The legacy Java implementation has been archived in `legacy-java-mobile-app` and is no longer the active runtime stack.

## Architecture at a glance

<img width="591" height="412" alt="leaflens_AI drawio" src="https://github.com/user-attachments/assets/2c5a6084-c809-4dab-b341-a54d029c5655" />

## Repository map

| Path | Purpose | Active status |
| --- | --- | --- |
| `react-native-app/` | Mobile app (Expo + React Native + TypeScript) | Active |
| `typescript-backend/` | API service (Express + TypeScript + MongoDB) | Active |
| `legacy-java-mobile-app/` | Archived Java implementation and historical artifacts | Archived |
| `CODEBASE_FEATURE_PARITY.md` | Feature parity tracking between legacy and current stack | Reference |
| `CORE_FUNCTIONALITY_LIST.md` | Baseline capability checklist from legacy implementation | Reference |
| `TECH_STACK_ANALYSIS.md` | Legacy stack analysis (historical context) | Reference |

## Quick start (local development)

### 1) Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance (local or hosted)
- For mobile Android builds: Android Studio + SDK
- Optional for AI features: Gemini API key from https://aistudio.google.com/api-keys

### 2) Start the backend

```bash
cd typescript-backend
npm install
cp .env.example .env
```

Update `.env` at minimum:
- `MONGODB_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY` (optional but recommended)

Run backend:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:8080/health
```

### 3) Start the mobile app

Open a new terminal:

```bash
cd react-native-app
npm install
cp .env.example .env
```

Set API URL in `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Then run:

```bash
npm run start
```

Platform shortcuts:
- `npm run android`
- `npm run ios`
- `npm run web`

## Day-to-day command reference

### Backend (`typescript-backend`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Run API in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start compiled API |
| `npm run typecheck` | TypeScript checks only |
| `npm run images:backfill-1080p` | Normalize stored images to 1080p WebP |
| `npm run db:migrate:delete-non-applicable-leaves` | Cleanup non-applicable leaf records |

### Mobile (`react-native-app`)

| Command | What it does |
| --- | --- |
| `npm run start` | Start Expo dev server |
| `npm run start:dev` | Start Expo with clean cache |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run web preview |
| `npm run typecheck` | TypeScript checks only |
| `npm run build:apk-local` | Local release APK build (clean) |
| `npm run build:apk-local:fast` | Faster local APK build |
| `npm run build:apk-local:gradle` | Fastest APK rebuild for JS/TS-only changes |

## API overview

Base URL (local): `http://localhost:8080`

Main route groups:
- `/api/v1/auth`
- `/api/v1/user`
- `/api/v1/leaf-analyzer`
- `/api/v1/leaves`
- `/api/v1/leaf-history`
- `/api/v1/tags`
- `GET /health`

Detailed API context:
- Backend docs: [`typescript-backend/README.md`](typescript-backend/README.md)

## Deployment and release

- Backend deployment guide (Railway): [`typescript-backend/docs/railway-deployment.md`](typescript-backend/docs/railway-deployment.md)
- Backend service README: [`typescript-backend/README.md`](typescript-backend/README.md)
- Mobile app README: [`react-native-app/README.md`](react-native-app/README.md)
- APK release workflow: [`.github/workflows/android-apk-release.yml`](.github/workflows/android-apk-release.yml)

## Legacy Java archive note

`legacy-java-mobile-app/` is kept for historical reference and parity comparison only.

Active development should target:
- `react-native-app/`
- `typescript-backend/`

Use these reference docs when validating migrated behavior:
- [`CODEBASE_FEATURE_PARITY.md`](CODEBASE_FEATURE_PARITY.md)
- [`CORE_FUNCTIONALITY_LIST.md`](CORE_FUNCTIONALITY_LIST.md)
   
