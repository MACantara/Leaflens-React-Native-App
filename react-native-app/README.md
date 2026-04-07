# React Native App (TypeScript)

This folder contains the LeafLens mobile app built with React Native + TypeScript (Expo).

## Included features
- Authentication: register, login, JWT session usage
- Leaf analysis from image upload
- Analyze and save to user collection
- Leaf exploration and save-to-collection
- User collection view with keyword/tag filtering

## Project structure
- App.tsx: main app shell and tab navigation state
- src/api: typed API client and endpoint wrappers
- src/screens: Auth, Analyze, Explore, Collection screens
- src/components: reusable UI components
- src/types: shared TypeScript models

## Setup
1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set API URL:

```bash
cp .env.example .env
```

Set EXPO_PUBLIC_API_BASE_URL in .env.

Fallback behavior if EXPO_PUBLIC_API_BASE_URL is missing:
- Development mode: falls back to http://localhost:8080
- Release APK: falls back to https://leaflens-backend.up.railway.app

Examples:
- Android emulator: http://10.0.2.2:8080
- iOS simulator: http://localhost:8080
- Physical device: http://<your-local-ip>:8080

3. Start the app:

```bash
npm run start
```

Then run Android/iOS/web from Expo CLI.

## Windows Android setup (one-time)
Current machine status from setup:
- Android Studio installed
- Android Platform Tools installed (adb available)
- Expo dependencies aligned with SDK 53

Remaining step needed to run on Android emulator:
1. Open Android Studio.
2. Go to More Actions -> SDK Manager.
3. Install these in SDK Tools:
- Android SDK Command-line Tools
- Android SDK Platform-Tools
- Android Emulator
4. In SDK Platforms, install at least one recent Android platform and system image (for example Android 14 or 15 x86_64).
5. Open Device Manager and create an AVD.
6. Start the emulator.
7. Run npm run android.

Alternative to emulator:
- Connect a real Android phone with USB debugging enabled and run npm run android.

Quick diagnostics:
- Run npm run android:check to verify ANDROID_HOME, adb, and connected devices.

## Backend endpoint assumptions
The app is wired to these backend route groups:
- /api/v1/auth
- /api/v1/leaf-analyzer
- /api/v1/leaves
- /api/v1/leaf-history
- /api/v1/tags

## Notes
- The app currently stores session in memory only (no persistent storage).
- Image upload uses multipart form data matching your backend field names:
  - analyze: image
  - analyze-save: leaf-image
- Navigation and action icons are loaded from bundled icon fonts during app startup for release APK reliability.

## Manual local APK build (fast debug loop)
Build release APK locally:

```bash
npm run build:apk-local
```

Faster rebuild (keeps generated native project, skips clean):

```bash
npm run build:apk-local:fast
```

Fastest rebuild when only JS/TS code changed (no app.json/plugin changes):

```bash
npm run build:apk-local:gradle
```

Expected APK output:
- android/app/build/outputs/apk/release/app-release.apk

If you hit `Unsupported class file major version 69`, your machine is using an unsupported Java runtime for the current Android Gradle pipeline.

Use JDK 17 or 21 (not Java 25), and make sure `javac` is available.

`npm run android` now runs a Java compatibility pre-check and will print install guidance if your Java setup is incompatible.

Fedora quick fix:

```bash
sudo dnf install java-21-openjdk-devel
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

## Android APK release automation
The repository includes a GitHub Actions workflow that builds and uploads an APK to GitHub Releases when you push a version tag:
- Workflow: [../.github/workflows/android-apk-release.yml](../.github/workflows/android-apk-release.yml)
- Trigger format: vMAJOR.MINOR.PATCH (example: v1.2.3)

Important for release builds:
- Set repository variable EXPO_PUBLIC_API_BASE_URL to your deployed backend URL.
- If omitted, workflow falls back to https://leaflens-backend.up.railway.app.

Release flow:
1. Bump app changes in source.
2. Create and push a semantic version tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

3. GitHub Actions builds the APK and publishes:
- leaflens-<version>.apk
- leaflens-<version>.apk.sha256

