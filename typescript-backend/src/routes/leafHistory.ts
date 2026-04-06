import { Router } from 'express';
import { collections } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';
import { toLeafDto } from '../utils/leafMapper.js';
import { toCaseInsensitiveRegex, toTagArray } from '../utils/query.js';
import { deleteLeafImageFromStorage, readLeafImageFromStorage } from '../services/objectStorage.js';

export const leafHistoryRouter = Router();

function assertSameUser(req: AuthenticatedRequest, userId: number): void {
  if (!req.authUser || req.authUser.userId !== userId) {
    throw new HttpError(403, 'You can only access your own resources');
  }
}

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
    const selectedCollection = await dbCollections.leafCollections.findOne({ userId });

    if (!selectedCollection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

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
