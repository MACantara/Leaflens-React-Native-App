# React Native MVP (TypeScript)

This folder contains an MVP mobile app for Leaflens built with React Native + TypeScript (Expo).

## Included MVP features
- Authentication: register, login, JWT session usage
- Leaf analysis from image upload
- Analyze and save to user collection
- Leaf exploration and save-to-collection
- User collection view with keyword/tag filtering
- Reference loading for saved leaves

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
