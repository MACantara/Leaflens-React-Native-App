import { Router } from 'express';
import multer from 'multer';
import { collections, nextSequence, type LeafDoc } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';
import { toLeafDto } from '../utils/leafMapper.js';
import { toCaseInsensitiveRegex, toTagArray } from '../utils/query.js';
import { ensureUserCollection } from '../utils/collection.js';
import { deleteLeafImageFromStorage, readLeafImageFromStorage, uploadLeafImageToStorage } from '../services/objectStorage.js';
import { normalizeImageBufferTo1080p } from '../services/imageProcessing.js';
import { resolveCaviteGrowthFlag } from '../services/cavitePlants.js';

export const leafHistoryRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function assertSameUser(req: AuthenticatedRequest, userId: number): void {
  if (!req.authUser || req.authUser.userId !== userId) {
    throw new HttpError(403, 'You can only access your own resources');
  }
}

function parseBooleanInput(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalized);
  }

  return false;
}

function normalizeTagsInput(value: unknown): string[] {
  const rawValues: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((entry) => rawValues.push(String(entry)));
  } else if (typeof value === 'string') {
    rawValues.push(...value.split(','));
  }

  const seen = new Set<string>();

  return rawValues
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      if (seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    });
}

function normalizeReferencesInput(value: unknown): Array<{ url: string; title: string }> {
  let rawArray: unknown[] = [];

  if (Array.isArray(value)) {
    rawArray = value;
  } else if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        rawArray = parsed;
      }
    } catch {
      rawArray = [];
    }
  }

  return rawArray
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const candidate = entry as { url?: unknown; title?: unknown };
      const url = String(candidate.url ?? '').trim();
      const title = String(candidate.title ?? candidate.url ?? '').trim();

      if (!url) {
        return null;
      }

      return {
        url,
        title: title || url
      };
    })
    .filter((reference): reference is { url: string; title: string } => Boolean(reference));
}

leafHistoryRouter.post(
  '/save/:userId',
  requireAuth,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    if (!req.file) {
      throw new HttpError(400, 'Image file required');
    }

    const dbCollections = await collections();
    const userExists = await dbCollections.users.findOne({ userId });
    if (!userExists) {
      throw new HttpError(404, 'User not found');
    }

    const normalizedImage = await normalizeImageBufferTo1080p({
      image: req.file.buffer,
      contentType: req.file.mimetype || 'image/jpeg',
      filename: req.file.originalname || 'leaf-image.jpg'
    });

    const commonName = String(req.body.commonName ?? '').trim();
    const scientificName = String(req.body.scientificName ?? '').trim();
    const origin = String(req.body.origin ?? '').trim();
    const usage = String(req.body.uses ?? req.body.usage ?? '').trim();
    const habitat = String(req.body.habitat ?? '').trim();
    const tags = normalizeTagsInput(req.body.tags);
    const references = normalizeReferencesInput(req.body.references);
    const isGrownInCavite = resolveCaviteGrowthFlag({
      commonName,
      scientificName,
      modelValue: parseBooleanInput(req.body.isGrownInCavite)
    });

    const leafId = await nextSequence('leafId');
    const uploadedImage = await uploadLeafImageToStorage({
      image: normalizedImage.buffer,
      contentType: normalizedImage.contentType,
      filename: normalizedImage.filename,
      leafId
    });

    const now = new Date();
    const leafDoc: LeafDoc = {
      leafId,
      commonName,
      scientificName,
      origin,
      usage,
      habitat,
      isGrownInCavite,
      imageFilename: uploadedImage.filename,
      imageContentType: uploadedImage.contentType,
      imageSize: uploadedImage.size,
      imageStorageProvider: 's3',
      imageStorageKey: uploadedImage.key,
      imageStorageBucket: uploadedImage.bucket,
      tags,
      references,
      createdAt: now,
      updatedAt: now
    };

    try {
      await dbCollections.leaves.insertOne(leafDoc);
    } catch (insertError) {
      await deleteLeafImageFromStorage(uploadedImage.key).catch(() => undefined);
      throw insertError;
    }

    const collection = await ensureUserCollection(userId);
    await dbCollections.leafCollections.updateOne(
      { collectionId: collection.collectionId },
      {
        $addToSet: { leafIds: leafId },
        $set: { updatedAt: new Date() }
      }
    );

    res.json('Leaf analysis saved successfully');
  })
);

leafHistoryRouter.get(
  '/user/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const dbCollections = await collections();
    const selectedCollection = await ensureUserCollection(userId);

    const leafIds = selectedCollection.leafIds ?? [];
    const leaves =
      leafIds.length > 0
        ? await dbCollections.leaves.find({ leafId: { $in: leafIds } }).sort({ leafId: -1 }).toArray()
        : [];

    res.json({
      leafList: leaves.map((leaf) => toLeafDto(leaf)),
      createdAt: selectedCollection.createdAt.toISOString(),
      empty: leaves.length === 0,
      leafCount: leaves.length
    });
  })
);

leafHistoryRouter.get(
  '/leaf/:leafId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const leafId = Number(req.params.leafId);
    const dbCollections = await collections();
    if (!Number.isFinite(leafId)) {
      throw new HttpError(400, 'Invalid leafId');
    }

    const leaf = await dbCollections.leaves.findOne({ leafId });
    if (!leaf) {
      res.status(404).json({ error: 'Leaf not found' });
      return;
    }

    res.json(toLeafDto(leaf));
  })
);

leafHistoryRouter.get(
  '/leaf/:leafId/image',
  requireAuth,
  asyncHandler(async (req, res) => {
    const leafId = Number(req.params.leafId);
    const dbCollections = await collections();

    if (!Number.isFinite(leafId)) {
      throw new HttpError(400, 'Invalid leafId');
    }

    const image = await dbCollections.leaves.findOne(
      { leafId },
      {
        projection: {
          imageStorageKey: 1,
          imageData: 1,
          imageContentType: 1,
          imageFilename: 1,
          imageSize: 1
        }
      }
    );

    if (!image) {
      res.status(404).end();
      return;
    }

    if (image.imageStorageKey) {
      const storedImage = await readLeafImageFromStorage(image.imageStorageKey);

      if (storedImage.contentType) {
        res.setHeader('Content-Type', storedImage.contentType);
      }

      if (image.imageFilename) {
        res.setHeader('Content-Disposition', `inline; filename="${image.imageFilename}"`);
      }

      if (storedImage.size) {
        res.setHeader('Content-Length', String(storedImage.size));
      }

      res.send(storedImage.data);
      return;
    }

    if (!image.imageData) {
      res.status(404).end();
      return;
    }

    if (image.imageContentType) {
      res.setHeader('Content-Type', image.imageContentType);
    }

    if (image.imageFilename) {
      res.setHeader('Content-Disposition', `inline; filename="${image.imageFilename}"`);
    }

    if (image.imageSize) {
      res.setHeader('Content-Length', String(image.imageSize));
    }

    res.send(image.imageData);
  })
);

leafHistoryRouter.delete(
  '/leaf/:leafId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const leafId = Number(req.params.leafId);
    const dbCollections = await collections();

    if (!Number.isFinite(leafId)) {
      throw new HttpError(400, 'Invalid leafId');
    }

    const leaf = await dbCollections.leaves.findOne(
      { leafId },
      { projection: { imageStorageKey: 1 } }
    );

    await dbCollections.leaves.deleteOne({ leafId });

    if (leaf?.imageStorageKey) {
      await deleteLeafImageFromStorage(leaf.imageStorageKey).catch(() => undefined);
    }

    await dbCollections.leafCollections.updateMany({}, { $pull: { leafIds: leafId } });
    res.json('Leaf deleted');
  })
);

leafHistoryRouter.get(
  '/user/:userId/count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const collection = await dbCollections.leafCollections.findOne({ userId });
    res.json(collection?.leafIds.length ?? 0);
  })
);

leafHistoryRouter.get(
  '/user/:userId/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const keyword = toCaseInsensitiveRegex(req.query.keyword);
    const tags = toTagArray(req.query.tag);

    const collection = await dbCollections.leafCollections.findOne({ userId });
    const leafIds = collection?.leafIds ?? [];

    if (leafIds.length === 0) {
      res.json([]);
      return;
    }

    const filter: {
      leafId: { $in: number[] };
      $or?: Array<Record<string, RegExp>>;
      tags?: { $in: string[] };
    } = {
      leafId: { $in: leafIds }
    };

    if (keyword) {
      filter.$or = [
        { commonName: keyword },
        { scientificName: keyword },
        { origin: keyword },
        { usage: keyword },
        { habitat: keyword }
      ];
    }

    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const results = await dbCollections.leaves.find(filter).sort({ leafId: -1 }).toArray();
    res.json(results.map((leaf) => toLeafDto(leaf)));
  })
);
