import { randomUUID } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';
import { collections } from '../db.js';
import { normalizeImageFileTo1080p } from '../services/imageProcessing.js';
import {
  listLeafImageObjects,
  overwriteLeafImageInStorage,
  readLeafImageFromStorage
} from '../services/objectStorage.js';

interface LeafImageMeta {
  key: string;
  leafId?: number;
  filename?: string;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

function isLikelyImageObject(contentType: string, key: string): boolean {
  if (contentType.toLowerCase().startsWith('image/')) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(path.extname(key).toLowerCase());
}

function inferContentType(contentType: string, key: string): string {
  if (contentType.toLowerCase().startsWith('image/')) {
    return contentType.toLowerCase();
  }

  const extension = path.extname(key).toLowerCase();
  if (extension === '.png') {
    return 'image/png';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  if (extension === '.heic' || extension === '.heif') {
    return 'image/heic';
  }

  return 'image/jpeg';
}

function parseLeafIdFromKey(key: string): number | undefined {
  const match = key.match(/^leaf-images\/(\d+)\//);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

async function readImageFormat(buffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();
    return (metadata.format ?? 'unknown').toLowerCase();
  } catch {
    return 'unknown';
  }
}

async function loadLeafImageMetadata(): Promise<Map<string, LeafImageMeta>> {
  const dbCollections = await collections();
  const docs = await dbCollections.leaves
    .find(
      {
        imageStorageKey: { $exists: true, $type: 'string', $ne: '' }
      },
      {
        projection: {
          leafId: 1,
          imageStorageKey: 1,
          imageFilename: 1
        }
      }
    )
    .toArray();

  const map = new Map<string, LeafImageMeta>();
  docs.forEach((doc) => {
    if (!doc.imageStorageKey) {
      return;
    }

    map.set(doc.imageStorageKey, {
      key: doc.imageStorageKey,
      leafId: doc.leafId,
      filename: doc.imageFilename
    });
  });

  return map;
}

async function run(): Promise<void> {
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'leaflens-resize-'));
  const dbCollections = await collections();
  const leafMetaByKey = await loadLeafImageMetadata();

  let continuationToken: string | undefined;
  let scanned = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  try {
    do {
      const page = await listLeafImageObjects({ continuationToken, maxKeys: 250 });

      for (const object of page.objects) {
        scanned += 1;
        let tempFilePath: string | undefined;

        try {
          const stored = await readLeafImageFromStorage(object.key);

          if (!isLikelyImageObject(stored.contentType, object.key)) {
            skipped += 1;
            console.log(`[SKIP] ${object.key} (not an image object)`);
            continue;
          }

          const contentType = inferContentType(stored.contentType, object.key);
          const sourceFormat = await readImageFormat(stored.data);
          const keyMeta = leafMetaByKey.get(object.key);
          const leafId = keyMeta?.leafId ?? parseLeafIdFromKey(object.key);
          const filename = keyMeta?.filename ?? path.basename(object.key);
          const extension = path.extname(filename).toLowerCase() || '.jpg';

          tempFilePath = path.join(tmpRoot, `${randomUUID()}${extension}`);
          await writeFile(tempFilePath, stored.data);

          const normalized = await normalizeImageFileTo1080p({
            filePath: tempFilePath,
            contentType,
            filename
          });

          const outputFormat = await readImageFormat(normalized.buffer);
          if (outputFormat !== 'webp') {
            throw new Error(`Expected WebP output but got ${outputFormat}`);
          }

          await overwriteLeafImageInStorage({
            key: object.key,
            image: normalized.buffer,
            contentType: normalized.contentType,
            leafId
          });

          if (keyMeta) {
            await dbCollections.leaves.updateMany(
              { imageStorageKey: object.key },
              {
                $set: {
                  imageFilename: normalized.filename,
                  imageContentType: normalized.contentType,
                  imageSize: normalized.buffer.length,
                  updatedAt: new Date()
                }
              }
            );
          }

          processed += 1;
          console.log(
            `[OK] ${object.key} (${sourceFormat} -> webp) -> ${normalized.width}x${normalized.height}, ${normalized.buffer.length} bytes`
          );
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[FAILED] ${object.key}: ${message}`);
        } finally {
          if (tempFilePath) {
            await rm(tempFilePath, { force: true });
          }
        }
      }

      continuationToken = page.nextContinuationToken;
    } while (continuationToken);
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }

  console.log(`Completed. scanned=${scanned}, processed=${processed}, failed=${failed}`);
  console.log(`Skipped non-image objects: ${skipped}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
