# LeafLens TypeScript Backend

This package contains the LeafLens API service that powers authentication, plant analysis, search, collections, and profile operations.

Additional presenter resource:
- [docs/presentation-guide.md](docs/presentation-guide.md)

## Table of contents

- [Service role](#service-role)
- [Architecture and runtime flow](#architecture-and-runtime-flow)
- [Tech stack](#tech-stack)
- [Domain model snapshot](#domain-model-snapshot)
- [API route catalog](#api-route-catalog)
- [AI analysis pipeline](#ai-analysis-pipeline)
- [Search behavior](#search-behavior)
- [Scripts](#scripts)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Presenter playbook](#presenter-playbook)
- [Potential technical questions and answers](#potential-technical-questions-and-answers)
- [Operational troubleshooting](#operational-troubleshooting)

## Service role

The backend is responsible for:
- JWT-based authentication and user profile operations
- Image upload normalization and storage orchestration
- AI-based plant analysis and structured response enforcement
- Collection/history/explore data retrieval and filtering
- Tag and condition-search support

## Architecture and runtime flow

Typical analyze-save request flow:
1. Client uploads image multipart to analyze-save route.
2. Service normalizes image to constrained dimensions and format.
3. AI analyzer generates structured JSON and grounding metadata.
4. Service validates applicability and normalizes response fields.
5. Persisted records are written to MongoDB and object storage.
6. Collection mapping is updated for the requesting user.

Key folders:
- `src/routes`: HTTP route handlers
- `src/services`: AI, storage, image, and enrichment logic
- `src/utils`: mapping, query helpers, async wrappers
- `src/scripts`: migration and maintenance utilities

## Tech stack

- Node.js + Express
- TypeScript
- MongoDB via `mongodb`
- JWT via `jsonwebtoken`
- Password hashing via `bcryptjs`
- Multipart parsing via `multer`
- Google GenAI via `@google/genai`
- S3-compatible object storage via `@aws-sdk/client-s3`

## Domain model snapshot

Primary persistence entities:
- User record
- Leaf record
- Leaf collection record
- Counter sequence record

Leaf records include:
- Identity and taxonomy fields
- Usage and medicinal metadata
- Condition associations
- Confidence and explanatory fields
- Tag list and optional references metadata
- Image storage metadata and sharing flags

## API route catalog

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/validate`

### User

- `GET /api/v1/user/:userId`
- `PUT /api/v1/user/:userId`
- `DELETE /api/v1/user/:userId`

### Analysis

- `POST /api/v1/leaf-analyzer/analyze`
- `POST /api/v1/leaf-analyzer/analyze-save/:userId`

### Explore and save

- `GET /api/v1/leaves/explore`
- `POST /api/v1/leaves/explore/:leafId/save/:userId`

### Collection/history

- `GET /api/v1/leaf-history/user/:userId`
- `GET /api/v1/leaf-history/leaf/:leafId`
- `GET /api/v1/leaf-history/leaf/:leafId/image`
- `DELETE /api/v1/leaf-history/leaf/:leafId`
- `GET /api/v1/leaf-history/user/:userId/count`
- `GET /api/v1/leaf-history/user/:userId/search`

### Tags and health

- `GET /api/v1/tags/user/:userId`
- `GET /health`

## AI analysis pipeline

Core characteristics:
- Uses model from `GEMINI_MODEL` (default: `gemma-4-31b-it`)
- Requests grounded tool support with Google Search when available
- Uses high reasoning level configuration in model request
- Handles unsupported grounding/tool errors with retry fallback

Output normalization includes:
- Required field enforcement and type coercion
- Non-plant detection and standardized fallback response
- Uses text normalization and structured lists
- Medicinal-use and condition extraction
- Reference extraction and redirect resolution

Safety posture:
- Explanatory and cautionary text expected in response fields
- Non-applicable analysis is not persisted on analyze-save route

## Search behavior

Backend search supports:
- Keyword matching across common/scientific name, usage, medicinal uses, medical conditions, habitat, and origin
- Tag filtering via query tags

Routes affected:
- Explore search endpoint
- User collection search endpoint

## Scripts

- `npm run dev`: watch mode with `tsx`
- `npm run typecheck`: TS validation without emit
- `npm run build`: compile into `dist/`
- `npm run start`: run compiled service
- `npm run images:backfill-1080p`: convert existing stored images to 1080p WebP
- `npm run db:migrate:delete-non-applicable-leaves`: remove invalid historical records
- `npm run db:migrate:remove-ai-references`: remove older AI reference fields if needed
- `npm run db:migrate:backfill-image-visibility`: backfill owner and sharing metadata
- `npm run db:wipe:plants -- --force`: irreversible test-data wipe for plant records/images

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

3. Set required values:
- `MONGODB_URL`
- `JWT_SECRET`

4. Start service:

```bash
npm run dev
```

5. Verify health:

```bash
curl http://localhost:8080/health
```

## Environment variables

Required:
- `MONGODB_URL`
- `JWT_SECRET`

Common optional:
- `MONGODB_DB`
- `JWT_EXPIRATION`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`

## Presenter playbook

### Before presentation

1. Seed representative plant data.
2. Verify AI endpoint path with one known image.
3. Confirm object storage permissions if image routes are part of demo.
4. Validate auth/register/login and one search route manually.

### During presentation

Suggested backend talking points:
- Contract-first structured AI responses
- Safe fallback behavior for non-plant images
- Searchability of medicinal-condition metadata
- Operational scripts for data quality and migrations

## Potential technical questions and answers

Q: How do you prevent malformed AI output from breaking clients?
A: Output is parsed and normalized; required fields are validated and errors are handled with explicit fallback logic.

Q: How do you manage links returned by grounded search?
A: References are deduplicated and redirect URLs are resolved to final targets where possible.

Q: Why both server-side and app-side search handling?
A: Server supports canonical filters; app can apply resilient local filtering if environment versions temporarily diverge.

Q: How do you control storage growth?
A: Images are normalized, and cleanup/migration scripts are available for lifecycle operations.

Q: Is data deletion supported for demos/tests?
A: Yes, controlled wipe/migration scripts are included with explicit force flags.

## Operational troubleshooting

Issue: analyze-save succeeds inconsistently
- Check API key, model availability, and image normalization logs.

Issue: explore returns fewer records than expected
- Validate `isImagePublic` state and collection ownership rules.

Issue: image route returns access errors
- Confirm auth token or public visibility status.

Issue: search feels stale across environments
- Confirm deployed version includes latest filter fields and mapping logic.

## Railway deployment

Monorepo deployment notes:
- Service root: `typescript-backend`
- Config path: `/typescript-backend/railway.json`

Detailed deployment guide:
- [docs/railway-deployment.md](docs/railway-deployment.md)
