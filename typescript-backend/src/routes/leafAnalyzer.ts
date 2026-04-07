import { Router } from 'express';
import multer from 'multer';
import { collections, nextSequence, type LeafDoc } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { isApplicableAnalysis } from '../services/analysisApplicability.js';
import { analyzeLeafImage } from '../services/aiAnalyzer.js';
import { normalizeImageBufferTo1080p } from '../services/imageProcessing.js';
import { deleteLeafImageFromStorage, uploadLeafImageToStorage } from '../services/objectStorage.js';
import { resolveCaviteGrowthFlag } from '../services/cavitePlants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';
import { ensureUserCollection } from '../utils/collection.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const leafAnalyzerRouter = Router();

leafAnalyzerRouter.post(
  '/analyze',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Image file is required' });
        return;
      }

      const normalizedImage = await normalizeImageBufferTo1080p({
        image: req.file.buffer,
        contentType: req.file.mimetype || 'image/jpeg',
        filename: req.file.originalname || 'leaf-image.jpg'
      });

      const analysis = await analyzeLeafImage(normalizedImage.buffer, normalizedImage.contentType);
      const enriched = {
        ...analysis,
        isGrownInCavite: resolveCaviteGrowthFlag({
          commonName: analysis.commonName,
          scientificName: analysis.scientificName,
          modelValue: analysis.isGrownInCavite
        })
      };

      res.json(enriched);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        commonName: 'Error',
        scientificName: 'Error processing image',
        origin: `Error: ${message}`,
        uses: 'N/A',
        habitat: 'N/A',
        isGrownInCavite: false,
        tags: []
      });
    }
  })
);

leafAnalyzerRouter.post(
  '/analyze-save/:userId',
  requireAuth,
  upload.single('leaf-image'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    if (!authReq.authUser || authReq.authUser.userId !== userId) {
      throw new HttpError(403, 'You can only save to your own collection');
    }

    if (!req.file) {
      throw new HttpError(400, 'Image file is required');
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

    const analysis = await analyzeLeafImage(normalizedImage.buffer, normalizedImage.contentType);
    const enriched = {
      ...analysis,
      isGrownInCavite: resolveCaviteGrowthFlag({
        commonName: analysis.commonName,
        scientificName: analysis.scientificName,
        modelValue: analysis.isGrownInCavite
      })
    };

    if (!isApplicableAnalysis(enriched)) {
      res.json({
        message: 'Leaf is not applicable and was not saved.',
        analysis: enriched,
        userId
      });
      return;
    }

    const leafId = await nextSequence('leafId');
    const now = new Date();
    const normalizedTags = enriched.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => tag.toLowerCase())
      .filter((tag, index, values) => values.indexOf(tag) === index);

    const uploadedImage = await uploadLeafImageToStorage({
      image: normalizedImage.buffer,
      contentType: normalizedImage.contentType,
      filename: normalizedImage.filename,
      leafId
    });

    const leafDoc: LeafDoc = {
      leafId,
      commonName: enriched.commonName,
      scientificName: enriched.scientificName || '',
      origin: enriched.origin || '',
      usage: enriched.uses || '',
      habitat: enriched.habitat || '',
      isGrownInCavite: enriched.isGrownInCavite,
      imageFilename: uploadedImage.filename,
      imageContentType: uploadedImage.contentType,
      imageSize: uploadedImage.size,
      imageStorageProvider: 's3',
      imageStorageKey: uploadedImage.key,
      imageStorageBucket: uploadedImage.bucket,
      tags: normalizedTags,
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

    res.json({
      message: 'Leaf analyzed and saved successfully',
      analysis: enriched,
      userId
    });
  })
);
