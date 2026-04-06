import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from '../utils/errors.js';
import type { JwtClaims } from '../types.js';

export interface AuthenticatedRequest extends Request {
  authUser?: JwtClaims;
}

export function signToken(payload: JwtClaims): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpirationSeconds
  });
}

export function verifyToken(token: string): JwtClaims {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtClaims;
  return {
    userId: Number(decoded.userId),
    email: String(decoded.email)
  };
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or invalid authorization header');
  }

  const token = authorization.slice(7);
  req.authUser = verifyToken(token);
  next();
}
