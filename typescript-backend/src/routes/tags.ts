import { Router } from 'express';
import { collections } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';

export const tagsRouter = Router();

tagsRouter.get(
  '/user/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    if (!authReq.authUser || authReq.authUser.userId !== userId) {
      throw new HttpError(403, 'You can only access your own resources');
    }

    const collection = await dbCollections.leafCollections.findOne({ userId });
    const leafIds = collection?.leafIds ?? [];

    if (leafIds.length === 0) {
      res.json([]);
      return;
    }

    const leaves = await dbCollections.leaves.find({ leafId: { $in: leafIds } }, { projection: { tags: 1 } }).toArray();
    const uniqueTags = new Set<string>();

    for (const leaf of leaves) {
      for (const tag of leaf.tags ?? []) {
        if (tag && tag.trim()) {
          uniqueTags.add(tag);
        }
      }
    }

    res.json(Array.from(uniqueTags).sort((a, b) => a.localeCompare(b)));
  })
);
