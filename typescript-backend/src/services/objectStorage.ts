import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../env.js';

export interface UploadedLeafImage {
  key: string;
  bucket: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface StoredLeafImage {
  data: Buffer;
  contentType: string;
  size: number;
}

function isStorageConfigured(): boolean {
  return [env.s3Endpoint, env.s3Bucket, env.s3AccessKeyId, env.s3SecretAccessKey].every(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}

function normalizeEndpoint(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolveFileExtension(filename: string, contentType: string): string {
  const cleanedName = filename.trim();
  const extensionMatch = cleanedName.match(/\.([A-Za-z0-9]+)$/);
  if (extensionMatch?.[1]) {
    return extensionMatch[1].toLowerCase();
  }

  const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic'
  };

  return mimeToExtension[contentType.toLowerCase()] ?? 'jpg';
}

let s3Client: S3Client | undefined;

function getS3Client(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error('Object storage is not fully configured. Check S3_* environment variables.');
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: normalizeEndpoint(env.s3Endpoint),
      region: env.s3Region,
      forcePathStyle: env.s3ForcePathStyle,
      credentials: {
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey
      }
    });
  }

  return s3Client;
}

export async function uploadLeafImageToStorage(params: {
  image: Buffer;
  contentType: string;
  filename: string;
  leafId: number;
}): Promise<UploadedLeafImage> {
  const client = getS3Client();
  const extension = resolveFileExtension(params.filename, params.contentType);
  const key = `leaf-images/${params.leafId}/${randomUUID()}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: params.image,
      ContentType: params.contentType,
      ContentLength: params.image.length,
      Metadata: {
        leafid: String(params.leafId)
      }
    })
  );

  return {
    key,
    bucket: env.s3Bucket,
    filename: params.filename,
    contentType: params.contentType,
    size: params.image.length
  };
}

export async function readLeafImageFromStorage(key: string): Promise<StoredLeafImage> {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.s3Bucket,
      Key: key
    })
  );

  if (!response.Body) {
    throw new Error('Stored image body is empty');
  }

  const bytes = await response.Body.transformToByteArray();

  return {
    data: Buffer.from(bytes),
    contentType: response.ContentType ?? 'application/octet-stream',
    size: Number(response.ContentLength ?? bytes.length)
  };
}

export async function deleteLeafImageFromStorage(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.s3Bucket,
      Key: key
    })
  );
}
