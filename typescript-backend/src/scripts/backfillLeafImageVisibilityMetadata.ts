import { collections } from '../db.js';

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

async function run(): Promise<void> {
  const dbCollections = await collections();

  const collectionDocs = await dbCollections.leafCollections
    .find(
      {},
      {
        projection: {
          userId: 1,
          leafIds: 1
        }
      }
    )
    .toArray();

  const leafOwnersMap = new Map<number, Set<number>>();

  collectionDocs.forEach((collectionDoc) => {
    const userId = toFiniteNumber(collectionDoc.userId);
    if (!userId) {
      return;
    }

    (collectionDoc.leafIds ?? []).forEach((leafIdRaw) => {
      const leafId = toFiniteNumber(leafIdRaw);
      if (!leafId) {
        return;
      }

      if (!leafOwnersMap.has(leafId)) {
        leafOwnersMap.set(leafId, new Set<number>());
      }

      leafOwnersMap.get(leafId)?.add(userId);
    });
  });

  const leaves = await dbCollections.leaves
    .find(
      {},
      {
        projection: {
          leafId: 1,
          ownerUserId: 1,
          isImagePublic: 1
        }
      }
    )
    .toArray();

  let updated = 0;
  let inferredOwner = 0;
  let defaultedPublic = 0;

  for (const leaf of leaves) {
    const leafId = toFiniteNumber(leaf.leafId);
    if (!leafId) {
      continue;
    }

    const currentOwner = toFiniteNumber((leaf as { ownerUserId?: unknown }).ownerUserId);
    const hasPublicFlag = typeof (leaf as { isImagePublic?: unknown }).isImagePublic === 'boolean';

    if (currentOwner && hasPublicFlag) {
      continue;
    }

    const ownerCandidates = [...(leafOwnersMap.get(leafId) ?? new Set<number>())].sort((a, b) => a - b);

    const nextOwnerUserId = currentOwner ?? ownerCandidates[0] ?? 0;
    const nextIsImagePublic =
      hasPublicFlag
        ? Boolean((leaf as { isImagePublic?: unknown }).isImagePublic)
        : ownerCandidates.length > 1 || nextOwnerUserId === 0;

    await dbCollections.leaves.updateOne(
      { leafId },
      {
        $set: {
          ownerUserId: nextOwnerUserId,
          isImagePublic: nextIsImagePublic,
          updatedAt: new Date()
        }
      }
    );

    updated += 1;
    if (!currentOwner && nextOwnerUserId !== 0) {
      inferredOwner += 1;
    }
    if (!hasPublicFlag) {
      defaultedPublic += 1;
    }
  }

  console.log(
    `Backfill done. Updated ${updated} leaves. ` +
      `Inferred owner for ${inferredOwner} leaves. ` +
      `Filled visibility for ${defaultedPublic} leaves.`
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Backfill failed: ${message}`);
  process.exit(1);
});
