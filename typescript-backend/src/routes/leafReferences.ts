import { Router } from 'express';
import { collections } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';

export const leafReferencesRouter = Router();

leafReferencesRouter.get(
  '/:leafId/references',
  requireAuth,
  asyncHandler(async (req, res) => {
    const leafId = Number(req.params.leafId);
    const dbCollections = await collections();

    if (!Number.isFinite(leafId)) {
      throw new HttpError(400, 'Invalid leafId');
    }

    const leaf = await dbCollections.leaves.findOne(
      { leafId },
      {
        projection: {
          references: 1
        }
      }
    );

    const references = leaf?.references ?? [];

    res.json(
      references.map((reference) => ({
        url: reference.url,
        title: reference.title ?? reference.url
      }))
    );
  })
);
