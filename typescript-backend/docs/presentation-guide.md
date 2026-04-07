# Backend Presentation Guide

This guide helps presenters explain backend capabilities, architecture choices, and operational readiness.

## Core backend story

- Receives plant images from mobile app
- Normalizes images for consistent AI processing
- Produces structured analysis with safety-oriented fields
- Persists records and image metadata
- Supports collection, explore, and search routes

## What to emphasize

1. Structured normalization of AI output
2. Applicability checks before persistence
3. Search support for medicinal and condition fields
4. Operational scripts for migration and cleanup
5. TypeScript-first maintainability across services/routes

## Route narrative

- Auth routes secure user access
- Analyzer routes produce/save plant intelligence
- Explore routes support discovery and save-to-collection
- History routes support ownership and lifecycle operations
- Tag route supports filter UX in mobile overlay

## Data and storage narrative

- MongoDB stores canonical structured records
- Object storage stores optimized image binaries
- Metadata links data and files for retrieval and cleanup

## Operational confidence points

- Health endpoint for service checks
- Typecheck/build/start scripts for repeatable operations
- Targeted migration scripts for controlled data evolution

## Typical panel Q and A

Q: How do you handle malformed AI responses?
A: Parsing and normalization enforce required schema fields, with fallback handling.

Q: How do you avoid storing irrelevant outputs?
A: Analyze-save checks applicability and can skip persistence for non-applicable analyses.

Q: How do you manage references and grounded search links?
A: References are normalized, deduplicated, and redirect resolution is attempted where applicable.

Q: How do you keep search useful as data evolves?
A: Search fields include identity, usage, medicinal, and condition metadata.

## Presenter troubleshooting plan

1. Verify environment variables
2. Verify health endpoint
3. Check logs during analyze-save request
4. Confirm storage credentials if image routes fail
5. Use known leaf sample to isolate network vs model issues
