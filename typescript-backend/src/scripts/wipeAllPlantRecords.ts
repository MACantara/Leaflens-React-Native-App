import { collections } from '../db.js';
import { deleteLeafImageFromStorage } from '../services/objectStorage.js';

function hasForceFlag(): boolean {
  return process.argv.includes('--force');
}

async function run(): Promise<void> {
  if (!hasForceFlag()) {
    console.log('This operation is destructive. Re-run with: npm run db:wipe:plants -- --force');
    process.exitCode = 1;
    return;
  }

  const dbCollections = await collections();
  const leaves = await dbCollections.leaves
    .find(
      {},
      {
        projection: {
          leafId: 1,
          imageStorageKey: 1
        }
      }
    )
    .toArray();

  let deletedImages = 0;
  let imageDeleteErrors = 0;

  for (const leaf of leaves) {
    if (!leaf.imageStorageKey) {
      continue;
    }

    try {
      await deleteLeafImageFromStorage(leaf.imageStorageKey);
      deletedImages += 1;
    } catch (error) {
      imageDeleteErrors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WARN] Failed to delete object ${leaf.imageStorageKey}: ${message}`);
    }
  }

  const deleteLeavesResult = await dbCollections.leaves.deleteMany({});
  const clearCollectionLinksResult = await dbCollections.leafCollections.updateMany(
    {},
    {
      $set: {
        leafIds: [],
        updatedAt: new Date()
      }
    }
  );

  await dbCollections.counters.updateOne({ _id: 'leafId' }, { $set: { seq: 0 } }, { upsert: true });

  console.log(
    `Deleted ${deleteLeavesResult.deletedCount} plant records. ` +
      `Deleted ${deletedImages} storage images. ` +
      `Cleared leaf links for ${clearCollectionLinksResult.modifiedCount} collections. ` +
      'Reset leafId counter to 0.'
  );

  if (imageDeleteErrors > 0) {
    console.log(`Image delete errors: ${imageDeleteErrors}`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Wipe failed: ${message}`);
  process.exit(1);
});
