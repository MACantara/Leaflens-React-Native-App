import { Router } from 'express';
import { collections } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureUserCollection } from '../utils/collection.js';
import { HttpError } from '../utils/errors.js';
import { toLeafDto } from '../utils/leafMapper.js';
import { toCaseInsensitiveRegex, toTagArray } from '../utils/query.js';

export const leavesRouter = Router();

leavesRouter.get(
  '/explore',
  requireAuth,
  asyncHandler(async (req, res) => {
    const keyword = toCaseInsensitiveRegex(req.query.keyword);
    const tags = toTagArray(req.query.tag);
    const dbCollections = await collections();

    const filter: {
      $or?: Array<Record<string, RegExp>>;
      tags?: { $in: string[] };
    } = {};

    if (keyword !== null) {
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

    const result = await dbCollections.leaves.find(filter).sort({ leafId: -1 }).toArray();

    res.json(result.map((leaf) => toLeafDto(leaf)));
  })
);

leavesRouter.post(
  '/explore/:leafId/save/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const leafId = Number(req.params.leafId);
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(leafId) || !Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid path parameter');
    }

    if (!authReq.authUser || authReq.authUser.userId !== userId) {
      throw new HttpError(403, 'You can only save to your own collection');
    }

    const leafExists = await dbCollections.leaves.findOne({ leafId });
    if (!leafExists) {
      throw new HttpError(404, 'Leaf not found');
    }

    const userExists = await dbCollections.users.findOne({ userId });
    if (!userExists) {
      throw new HttpError(404, 'User not found');
    }

    const collection = await ensureUserCollection(userId);
    await dbCollections.leafCollections.updateOne(
      { collectionId: collection.collectionId },
      {
        $addToSet: { leafIds: leafId },
        $set: { updatedAt: new Date() }
      }
    );

    res.json('Leaf saved to collection');
  })
);
