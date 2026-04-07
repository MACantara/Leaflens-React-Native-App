# React Native App (TypeScript)

This package contains the LeafLens mobile client built with Expo + React Native + TypeScript.

It is optimized for:
- Fast local iteration (Dev Client + Metro)
- Reliable standalone APK demos (release builds)
- Clear UX through shared loading/empty/progress/error components

Additional presenter resource:
- [PRESENTATION_GUIDE.md](PRESENTATION_GUIDE.md)

## Table of contents

- [What this app does](#what-this-app-does)
- [Architecture and screen map](#architecture-and-screen-map)
- [Shared UI and state utilities](#shared-ui-and-state-utilities)
- [Search behavior](#search-behavior)
- [Setup](#setup)
- [Android setup and troubleshooting](#android-setup-and-troubleshooting)
- [Build and run modes](#build-and-run-modes)
- [Presenter tips and tricks](#presenter-tips-and-tricks)
- [Potential demo questions and answers](#potential-demo-questions-and-answers)

## What this app does

- User auth (register/login)
- Leaf analysis and save flow
- Collection browsing and details
- Explore public plants and save to collection
- Global search overlay with keyword + tag parsing
- Condition-oriented plant discovery
- Profile edit and account deletion

## Architecture and screen map

Main shell:
- `App.tsx`: navigation shell, global search overlay, menu, and cross-screen wiring

Screens:
- `AuthScreen`: authentication UI and session bootstrap
- `AnalyzeScreen`: image pick/capture and analysis result rendering
- `CollectionScreen`: saved plants with local filtering
- `ExploreScreen`: public plants with local filtering and save actions
- `PlantDetailsScreen`: deep details, sharing toggle, delete action
- `HistoryScreen`: saved analysis timeline and count
- `ProfileScreen`: profile management

API wrappers:
- `src/api/client.ts`: request utility, timeout handling, error parsing
- `src/api/leaves.ts`: leaf routes
- `src/api/auth.ts`, `src/api/user.ts`

## Shared UI and state utilities

The app now centralizes status UX through:
- `src/components/StateFeedback.tsx`

Provided components:
- `StatusBanner`: loading/info/success/error banner with icon + tone
- `EmptyStateCard`: icon + title + explanatory text for empty views

Other shared behavior:
- `src/components/AppModalProvider.tsx`: standardized alerts/confirm dialogs
- `src/utils/mobileGestures.ts`: pull-to-refresh and menu gesture helpers

Why this matters for presentations:
- Every key state is visible and consistently styled.
- Empty states explain what to do next.
- Progress states reduce ambiguity during network-heavy actions.

## Search behavior

Global search overlay supports:
- Keyword search (name, uses, medicinal fields, conditions)
- Tag filtering via selectable pills
- Inline hashtag parsing from input, for example `#medicinal #headache`

Condition search notes:
- The app uses local filtering on fetched lists for robust behavior even if backend search filters differ by environment version.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Set API endpoint:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

Common values:
- Android emulator: `http://10.0.2.2:8080`
- iOS simulator: `http://localhost:8080`
- Physical device: `http://<your-lan-ip>:8080`

Fallback behavior if variable is missing:
- Dev: `http://localhost:8080`
- Release APK: `https://leaflens-backend.up.railway.app`

## Android setup and troubleshooting

### One-time Linux/Fedora setup

1. Install Java:

```bash
sudo dnf install java-21-openjdk-devel
```

2. Configure SDK paths:

```bash
mkdir -p ~/Android/Sdk/cmdline-tools
```

Place Android Command-line Tools in:
- `~/Android/Sdk/cmdline-tools/latest/`

3. Add shell profile exports:

```bash
cat <<'EOF' >> ~/.bashrc
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"
EOF
source ~/.bashrc
```

4. Accept licenses and install required NDK:

```bash
yes | sdkmanager --licenses
sdkmanager "ndk;27.1.12297006"
```

### Frequent issues

Issue: unsupported Java class version
- Use JDK 17 or 21 only.

Issue: Android command fails from wrong folder
- Run app commands from `react-native-app` directory.

Issue: app installs but cannot reach backend
- Use reachable host in `EXPO_PUBLIC_API_BASE_URL`.

## Build and run modes

### Dev Client mode

```bash
npm run android
```

Behavior:
- Builds/runs development client
- Requires Metro running
- Best for active coding and debugging

### Release APK mode (standalone)

Build:

```bash
npm run build:apk-local
```

Install:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Behavior:
- Runs without Metro
- Suitable for stable demos and handoff

Fast variants:

```bash
npm run build:apk-local:fast
npm run build:apk-local:gradle
```

## Presenter tips and tricks

1. Use release APK when presenting to non-technical audiences.
2. Keep a prepared account with representative history and collection data.
3. Use one known-good leaf image for consistent demo behavior.
4. Demonstrate global search with both keyword and hashtag tags.
5. Show state feedback intentionally (loading, empty, and error clarity).

## Potential demo questions and answers

Q: How do you prevent confusing blank screens?
A: The app uses shared `StatusBanner` and `EmptyStateCard` components across screens.

Q: How does search handle medicinal condition queries?
A: Search checks condition and medicinal fields and supports tag + keyword combinations.

Q: Why keep both Dev Client and release workflows?
A: Dev Client is fastest for iteration; release APK is most reliable for standalone demos.

Q: Does the app keep users logged in after restart?
A: Current implementation stores session in memory only.

## Release automation

APK release workflow:
- `../.github/workflows/android-apk-release.yml`

Tag format:
- `vMAJOR.MINOR.PATCH` (example `v1.0.1`)

Example:

```bash
git tag v1.0.1
git push origin v1.0.1
```

Artifacts:
- `leaflens-<version>.apk`
- `leaflens-<version>.apk.sha256`

