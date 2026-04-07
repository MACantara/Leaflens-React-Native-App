import dotenv from 'dotenv';

dotenv.config();

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function getDbNameFromMongoUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const dbName = parsed.pathname.replace(/^\//, '').trim();
    return dbName || undefined;
  } catch {
    return undefined;
  }
}

const fallbackMongoUrl = 'mongodb://localhost:27017/leaflens';
const mongoUrl = process.env.MONGODB_URL ?? process.env.MONGO_URL ?? fallbackMongoUrl;

export const env = {
  port: asNumber(process.env.PORT, 8080),
  mongoUrl,
  mongoDbName: process.env.MONGODB_DB ?? process.env.MONGO_DB ?? getDbNameFromMongoUrl(mongoUrl) ?? 'leaflens',
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret-change-me',
  jwtExpirationSeconds: asNumber(process.env.JWT_EXPIRATION, 86400),
  geminiModel:
    process.env.GEMINI_MODEL ??
    process.env.SPRING_AI_OPENAI_CHAT_OPTIONS_MODEL ??
    process.env.OPENAI_MODEL ??
    'gemma-4-31b-it',
  geminiApiKey:
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.SPRING_AI_OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    '',
  s3Endpoint: process.env.S3_ENDPOINT ?? process.env.AWS_ENDPOINT_URL ?? '',
  s3Region: process.env.S3_REGION ?? process.env.AWS_REGION ?? 'auto',
  s3Bucket: process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET ?? '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? '',
  s3ForcePathStyle: asBoolean(process.env.S3_FORCE_PATH_STYLE, true)
};
