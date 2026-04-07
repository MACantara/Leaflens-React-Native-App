# LeafLens Presentation Knowledge Base

This document is a fast-reference guide for technical and semi-technical presentations.

## 1. One-minute system pitch

LeafLens is a mobile-first platform that identifies plant leaves, returns structured and safety-aware analysis, and enables users to build searchable plant collections. The system combines a React Native app and TypeScript backend with AI-assisted classification and enrichment.

## 2. Architecture summary

- Client: Expo React Native app for Android-focused delivery
- API: Express TypeScript backend
- Data: MongoDB for structured records
- Media: S3-compatible object storage for leaf images
- AI: Google GenAI model with grounded search capability where available

## 3. Why this architecture

- Single language family (TypeScript) across frontend and backend improves velocity
- Clear separation of responsibilities by routes/services/screens
- Practical operational scripts for migration and cleanup
- Demo-friendly standalone APK mode

## 4. What to emphasize in demos

1. Structured results, not just raw model text
2. Safety notes and confidence labels
3. Condition and tag-based discovery
4. Consistent loading/empty/error feedback UX
5. Real device readiness via release APK

## 5. Quick demo plan

1. Login
2. Analyze image
3. Save result
4. Open collection and details
5. Search by condition in overlay
6. Explore and save public plant
7. Show profile management

## 6. Common judge questions

Q: How do you handle unreliable model output?
A: Backend normalizes and validates AI output, with fallback paths and strict field handling.

Q: How is user experience protected during latency?
A: Shared state-feedback components provide clear loading/progress/error cues.

Q: How do you support search flexibility?
A: Combined keyword and tag logic with medicinal-condition metadata support.

Q: Why keep legacy folder?
A: For traceability and parity validation only; active runtime is TypeScript stack.

## 7. Risk and mitigation talking points

- Risk: Environment mismatch between local and deployed backend
- Mitigation: Environment-driven base URL configuration and clear docs

- Risk: Mobile build setup complexity
- Mitigation: Build prechecks and platform setup documentation

- Risk: Ambiguous UX during empty/loading states
- Mitigation: Centralized reusable state components

## 8. Live troubleshooting script

1. Confirm backend health endpoint
2. Confirm app API base URL in logs
3. Retry with known-good leaf sample
4. Clear search tags and retry broad keyword
5. Switch to release APK if Metro connectivity is unstable

## 9. Presenter checklist

- Device charged and USB debugging enabled
- APK pre-installed fallback
- Test account available
- Known sample images available offline
- Backend URL tested from phone network

## 10. Follow-up materials to provide

- Root architecture overview
- Mobile README runbook
- Backend API and operations guide
- Railway deployment reference
