import { MongoServerError } from 'mongodb';
import { collections, nextSequence, type LeafCollectionDoc } from '../db.js';

export async function ensureUserCollection(userId: number): Promise<LeafCollectionDoc> {
  const dbCollections = await collections();
  const existing = await dbCollections.leafCollections.findOne({ userId });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const collectionId = await nextSequence('collectionId');
  const defaultCollection: LeafCollectionDoc = {
    collectionId,
    userId,
    collectionName: 'My Collection',
    description: 'Default collection',
    leafIds: [],
    createdAt: now,
    updatedAt: now
  };

  try {
    await dbCollections.leafCollections.insertOne(defaultCollection);
    return defaultCollection;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const concurrent = await dbCollections.leafCollections.findOne({ userId });
      if (concurrent) {
        return concurrent;
      }
    }

    throw error;
  }
}
