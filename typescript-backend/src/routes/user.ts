import { Router } from 'express';
import { z } from 'zod';
import { collections } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';

const updateUserSchema = z.object({
  userName: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255)
});

export const userRouter = Router();

function assertSameUser(req: AuthenticatedRequest, userId: number): void {
  if (!req.authUser || req.authUser.userId !== userId) {
    throw new HttpError(403, 'You can only access your own resources');
  }
}

userRouter.get(
  '/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const user = await dbCollections.users.findOne({ userId });
    if (!user) {
      res.status(404).end();
      return;
    }

    res.json({
      userId: user.userId,
      userName: user.userName,
      email: user.email
    });
  })
);

userRouter.put(
  '/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const payload = updateUserSchema.parse(req.body);

    const existing = await dbCollections.users.findOne({ userId });
    if (!existing) {
      res.status(404).end();
      return;
    }

    const existingByEmail = await dbCollections.users.findOne({
      emailLower: payload.email.toLowerCase(),
      userId: { $ne: userId }
    });

    if (existingByEmail) {
      throw new HttpError(400, 'Email already used');
    }

    await dbCollections.users.updateOne(
      { userId },
      {
        $set: {
          userName: payload.userName,
          email: payload.email,
          emailLower: payload.email.toLowerCase(),
          updatedAt: new Date()
        }
      }
    );

    const user = await dbCollections.users.findOne({ userId });

    if (!user) {
      res.status(404).end();
      return;
    }

    res.json({
      message: 'User updated successfully',
      userId: user.userId,
      userName: user.userName,
      email: user.email
    });
  })
);

userRouter.delete(
  '/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = Number(req.params.userId);
    const dbCollections = await collections();

    if (!Number.isFinite(userId)) {
      throw new HttpError(400, 'Invalid userId');
    }

    assertSameUser(authReq, userId);

    const deleted = await dbCollections.users.deleteOne({ userId });
    await dbCollections.leafCollections.deleteOne({ userId });

    if (deleted.deletedCount === 0) {
      res.status(404).end();
      return;
    }

    res.json({
      message: 'User deleted',
      userId
    });
  })
);
