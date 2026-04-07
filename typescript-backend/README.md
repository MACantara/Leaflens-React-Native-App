# Leaflens TypeScript Backend

This folder contains the TypeScript/Node.js Leaflens backend API.

## Tech stack
- Node.js + Express
- TypeScript
- MongoDB (`mongodb`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Multipart upload (`multer`)
- Google Gemini image analysis (`@google/genai`)
- S3-compatible object storage (`@aws-sdk/client-s3`)

## API routes
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/validate`
- `GET /api/v1/user/:userId`
- `PUT /api/v1/user/:userId`
- `DELETE /api/v1/user/:userId`
- `POST /api/v1/leaf-analyzer/analyze`
- `POST /api/v1/leaf-analyzer/analyze-save/:userId`
- `GET /api/v1/leaves/explore`
- `POST /api/v1/leaves/explore/:leafId/save/:userId`
- `GET /api/v1/leaf-history/user/:userId`
- `GET /api/v1/leaf-history/leaf/:leafId`
- `GET /api/v1/leaf-history/leaf/:leafId/image`
- `DELETE /api/v1/leaf-history/leaf/:leafId`
- `GET /api/v1/leaf-history/user/:userId/count`
- `GET /api/v1/leaf-history/user/:userId/search`
- `GET /api/v1/tags/user/:userId`

## Scripts
- `npm run dev`: Run in watch mode with `tsx`
- `npm run build`: Compile TypeScript into `dist/`
- `npm run start`: Start compiled app from `dist/server.js`
- `npm run typecheck`: Run TypeScript checks without emitting files
- `npm run images:backfill-1080p`: Resize all bucket images to 1080p and transcode the image bytes to WebP (uses temporary files and removes them automatically)
- `npm run db:migrate:delete-non-applicable-leaves`: Delete non-applicable leaf records and remove their stored images
- `npm run db:migrate:remove-ai-references`: Remove previously stored AI-generated references from leaf records
- `npm run db:wipe:plants -- --force`: Delete all plant records and related stored images (testing helper)

## Local setup
1. Copy `.env.example` to `.env` and fill values.
2. Ensure MongoDB is reachable from your machine/runtime.
3. Install dependencies:

```bash
npm install
```

4. Start in dev mode:

```bash
npm run dev
```

5. Health check endpoint:

```bash
curl http://localhost:8080/health
```

## Environment variables
Required for normal operation:
- `MONGODB_URL`
- `JWT_SECRET`

Optional (with defaults):
- `MONGODB_DB` (default: derived from URL or `leaflens`)
- `JWT_EXPIRATION` (default: `86400` seconds)
- `GEMINI_API_KEY` (empty is allowed; analyze endpoints return fallback response)
- `GEMINI_MODEL` (default: `gemini-3-flash-preview`)
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`

## Railway deployment
This repository is a monorepo. For Railway service configuration:
- Set the service root directory to `typescript-backend`
- Set the config-as-code file path to `/typescript-backend/railway.json`

Then add required environment variables and deploy.

For full deployment steps, troubleshooting, and team onboarding notes, see:
- [`docs/railway-deployment.md`](docs/railway-deployment.md)

## Notes
- Uploads are normalized to a maximum of 1920x1080 and converted to WebP before analysis/storage.
- If analysis is not applicable, `analyze-save` will not store the record or image.
- `images:backfill-1080p` updates existing bucket objects to 1080p + WebP and synchronizes Mongo image metadata.
- Set `EXPO_PUBLIC_API_BASE_URL` in the React Native app to this backend URL.
