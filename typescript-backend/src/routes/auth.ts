import bcrypt from 'bcryptjs';
import { MongoServerError } from 'mongodb';
import { Router } from 'express';
import { z } from 'zod';
import { collections, nextSequence, type UserDoc } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/errors.js';
import { signToken, verifyToken } from '../middleware/auth.js';
import type { AuthResponse } from '../types.js';

const registerSchema = z.object({
  userName: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(255)
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(255)
});

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const dbCollections = await collections();
    const emailLower = payload.email.toLowerCase();

    const existing = await dbCollections.users.findOne({ emailLower });

    if (existing) {
      throw new HttpError(400, 'Email already used');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userId = await nextSequence('userId');
    const now = new Date();

    const newUser: UserDoc = {
      userId,
      userName: payload.userName,
      email: payload.email,
      emailLower,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };

    try {
      await dbCollections.users.insertOne(newUser);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new HttpError(400, 'Email already used');
      }

      throw error;
    }

    const token = signToken({ userId, email: payload.email });

    const response: AuthResponse = {
      token,
      userId,
      userName: payload.userName,
      email: payload.email,
      message: 'User registered successfully'
    };

    res.json(response);
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const dbCollections = await collections();

    const user = await dbCollections.users.findOne({ emailLower: payload.email.toLowerCase() });

    if (!user) {
      throw new HttpError(400, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(payload.password, user.password);
    if (!isMatch) {
      throw new HttpError(400, 'Invalid email or password');
    }

    const token = signToken({ userId: user.userId, email: user.email });

    const response: AuthResponse = {
      token,
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      message: 'Login successfully'
    };

    res.json(response);
  })
);

authRouter.post('/validate', (req, res) => {
  const authorization = req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(400).json({ error: 'Invalid authorization header' });
    return;
  }

  try {
    const token = authorization.slice(7);
    const claims = verifyToken(token);

    res.json({
      valid: true,
      userId: claims.userId,
      email: claims.email
    });
  } catch {
    res.status(400).json({
      valid: false,
      error: 'Token validation failed'
    });
  }
});
