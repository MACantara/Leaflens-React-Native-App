# Deploying the TypeScript Backend to Railway

This guide covers a repeatable deployment flow for the TypeScript backend in this monorepo.

## What this deploys
- Service: `typescript-backend`
- Runtime: Node.js + Express
- Build command: `npm run build`
- Start command: `npm run start`
- Healthcheck: `/health`

Those values are defined in [../railway.json](../railway.json).

## Prerequisites
- The repository is pushed to GitHub.
- You have Railway project access.
- You have a MongoDB connection string (Railway Mongo plugin or external MongoDB).
- You have API/storage credentials ready for optional AI and image-upload features.

## Option A: Deploy from Railway Dashboard (recommended)
1. In Railway, create a new project from your GitHub repo.
2. Create/select a service for this backend.
3. Open service settings and set:
   - Root Directory: `typescript-backend`
   - Config as Code path: `/typescript-backend/railway.json`

Important: in monorepos, Railway config file path is absolute from repo root.

4. Add environment variables in the service:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | Recommended | Use `production` |
| `PORT` | No | Railway injects this automatically |
| `MONGODB_URL` | Yes | Use your Mongo connection string |
| `MONGODB_DB` | Optional | Defaults to db name in URL or `leaflens` |
| `JWT_SECRET` | Yes | Generate with `openssl rand -hex 32` |
| `JWT_EXPIRATION` | Optional | Default `86400` |
| `GEMINI_API_KEY` | Optional | If unset, analyze endpoints use safe fallback response |
| `GEMINI_MODEL` | Optional | Default `gemma-4-31b-it` |
| `S3_ENDPOINT` | Optional | Needed for image storage |
| `S3_REGION` | Optional | Default `auto` |
| `S3_BUCKET` | Optional | Needed for image storage |
| `S3_ACCESS_KEY_ID` | Optional | Needed for image storage |
| `S3_SECRET_ACCESS_KEY` | Optional | Needed for image storage |
| `S3_FORCE_PATH_STYLE` | Optional | Default `true` |

5. Trigger a deployment.
6. After deploy, verify:
   - `GET /health` returns `{ "status": "ok" }`
   - API route smoke test (for example `POST /api/v1/auth/validate`)

## Option B: Deploy using Railway CLI
Use this if you prefer terminal workflows.

```bash
npm i -g @railway/cli
railway login
```

From the repository root:

```bash
railway link
railway up
```

Make sure the linked service points to the backend service and that the service root directory is set to `typescript-backend`.

## MongoDB setup notes
You can use either:
- Railway MongoDB service/plugin
- External MongoDB (Atlas, self-hosted, etc.)

If you create MongoDB on Railway, map its URL into `MONGODB_URL`.

## React Native integration
After first successful deploy, copy the public backend URL and set this in the mobile app environment:

- `EXPO_PUBLIC_API_BASE_URL=<your-railway-backend-url>`

Then rebuild/restart the React Native app.

## Troubleshooting

### Deploy succeeds but app crashes on startup
- Check `MONGODB_URL` and `JWT_SECRET`.
- Confirm MongoDB network access and credentials.

### 502 / application failed to respond
- Ensure service listens on `PORT` (already implemented in this backend).
- Confirm healthcheck path `/health` is reachable.

### No start command could be found
- Confirm [../railway.json](../railway.json) is loaded by setting config path `/typescript-backend/railway.json`.
- Confirm root directory is `typescript-backend`.

### AI endpoint returns fallback response
- Set `GEMINI_API_KEY` correctly.

## Team workflow recommendations
- Keep deployment-related updates in [../railway.json](../railway.json).
- Keep env key definitions in [../.env.example](../.env.example).
- Update [../README.md](../README.md) whenever deploy process changes.
