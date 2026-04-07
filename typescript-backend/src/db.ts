import { Db, MongoClient } from 'mongodb';
import { env } from './env.js';
import type { LeafReference } from './types.js';

export interface CounterDoc {
  _id: string;
  seq: number;
}

export interface UserDoc {
  userId: number;
  userName: string;
  email: string;
  emailLower: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeafDoc {
  leafId: number;
  commonName: string;
  scientificName: string;
  origin: string;
  usage: string;
  habitat: string;
  isGrownInCavite?: boolean;
  imageData?: Buffer;
  imageFilename: string;
  imageContentType: string;
  imageSize: number;
  imageStorageProvider?: 's3';
  imageStorageKey?: string;
  imageStorageBucket?: string;
  imageStorageEndpoint?: string;
  tags: string[];
  references: LeafReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeafCollectionDoc {
  collectionId: number;
  userId: number;
  collectionName: string;
  description: string;
  leafIds: number[];
  createdAt: Date;
  updatedAt: Date;
}

let mongoClient: MongoClient | undefined;
let mongoDb: Db | undefined;

async function getMongoDb(): Promise<Db> {
  if (mongoDb) {
    return mongoDb;
  }

  mongoClient = new MongoClient(env.mongoUrl);
  await mongoClient.connect();
  mongoDb = mongoClient.db(env.mongoDbName);
  return mongoDb;
}

export async function collections() {
  const db = await getMongoDb();
  return {
    users: db.collection<UserDoc>('users'),
    leaves: db.collection<LeafDoc>('leaves'),
    leafCollections: db.collection<LeafCollectionDoc>('leafCollections'),
    counters: db.collection<CounterDoc>('counters')
  };
}

export async function nextSequence(name: string): Promise<number> {
  const dbCollections = await collections();
  await dbCollections.counters.updateOne({ _id: name }, { $inc: { seq: 1 } }, { upsert: true });
  const current = await dbCollections.counters.findOne({ _id: name });

  if (!current) {
    throw new Error(`Failed to generate sequence for ${name}`);
  }

  return current.seq;
}

export async function initializeMongo(): Promise<void> {
  const dbCollections = await collections();
  await dbCollections.users.createIndex({ userId: 1 }, { unique: true });
  await dbCollections.users.createIndex({ emailLower: 1 }, { unique: true });
  await dbCollections.leaves.createIndex({ leafId: 1 }, { unique: true });
  await dbCollections.leafCollections.createIndex({ collectionId: 1 }, { unique: true });
  await dbCollections.leafCollections.createIndex({ userId: 1 }, { unique: true });
}
