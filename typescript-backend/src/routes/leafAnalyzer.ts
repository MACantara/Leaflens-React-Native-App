import { Router } from 'express';
import multer from 'multer';
import { collections, nextSequence, type LeafDoc } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeLeafImage } from '../services/aiAnalyzer.js';
import { deleteLeafImageFromStorage, uploadLeafImageToStorage } from '../services/objectStorage.js';
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

      const analysis = await analyzeLeafImage(req.file.buffer, req.file.mimetype || 'image/jpeg');
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        commonName: 'Error',
        scientificName: 'Error processing image',
        origin: `Error: ${message}`,
        uses: 'N/A',
        habitat: 'N/A',
        isGrownInCavite: false,
        tags: [],
        references: []
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

    const analysis = await analyzeLeafImage(req.file.buffer, req.file.mimetype || 'image/jpeg');

    const leafId = await nextSequence('leafId');
    const now = new Date();
    const sourceMimeType = req.file.mimetype || 'image/jpeg';
    const sourceFilename = req.file.originalname || 'leaf-image.jpg';
    const normalizedTags = analysis.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => tag.toLowerCase())
      .filter((tag, index, values) => values.indexOf(tag) === index);
    const normalizedReferences = analysis.references
      .map((ref) => ({
        url: String(ref.url ?? '').trim(),
        title: String(ref.title ?? ref.url ?? '').trim()
      }))
      .filter((ref) => ref.url.length > 0)
      .map((ref) => ({
        url: ref.url,
        title: ref.title || ref.url
      }));

    const uploadedImage = await uploadLeafImageToStorage({
      image: req.file.buffer,
      contentType: sourceMimeType,
      filename: sourceFilename,
      leafId
    });

    const leafDoc: LeafDoc = {
      leafId,
      commonName: analysis.commonName,
      scientificName: analysis.scientificName || '',
      origin: analysis.origin || '',
      usage: analysis.uses || '',
      habitat: analysis.habitat || '',
      imageFilename: uploadedImage.filename,
      imageContentType: uploadedImage.contentType,
      imageSize: uploadedImage.size,
      imageStorageProvider: 's3',
      imageStorageKey: uploadedImage.key,
      imageStorageBucket: uploadedImage.bucket,
      tags: normalizedTags,
      references: normalizedReferences,
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
      analysis,
      userId
    });
  })
);
