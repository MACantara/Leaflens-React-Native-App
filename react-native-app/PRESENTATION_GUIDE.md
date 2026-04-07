# Mobile Presentation Guide

This document helps presenters demonstrate the LeafLens mobile app clearly and confidently.

## Demo objective

Show that the app can analyze plants, communicate confidence and safety, and help users discover plants by medicinal context and condition search.

## Suggested flow (7-10 minutes)

1. Open app and login
2. Capture/upload leaf image
3. Explain analysis card sections
4. Save result and open collection
5. Open details and navigate via tags/conditions
6. Use global search overlay with keyword and hashtag tags
7. Open Explore and save a public plant
8. Show profile update/delete safeguards

## UX improvements to call out

- Centralized state banners for loading/info/error/success
- Empty cards with icon/title/description instead of plain blank text
- Explicit progress states for long actions (analyze/save/delete/update)
- Scrollable and manageable tag UI in global search overlay

## Search demonstration tips

- Start with a broad keyword
- Add one tag via overlay pills
- Demonstrate hashtag parsing in input, for example #medicinal
- Search a condition term such as headache and compare results

## If search appears empty unexpectedly

1. Clear selected tags and rerun
2. Retry with a broader keyword
3. Verify dataset has matching records
4. Confirm API base URL in app log

## Device and build checklist

- Dev Client mode for live coding: npm run android
- Release APK mode for stable demos: npm run build:apk-local then adb install
- Ensure EXPO_PUBLIC_API_BASE_URL is correctly set before release build

## Typical mobile questions and answers

Q: How do users know what the app is doing during delays?
A: StatusBanner is used to show clear loading/progress messages across key flows.

Q: How do you avoid confusing empty screens?
A: EmptyStateCard provides icon + context + next-step hints.

Q: Is login persistent across app restarts?
A: Current session is in-memory only.

Q: Why both Dev Client and release APK?
A: Dev Client maximizes development speed; release APK maximizes runtime stability for presentations.
