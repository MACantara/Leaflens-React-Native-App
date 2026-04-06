import { collections } from '../db.js';
import { isApplicableLeafRecord } from '../services/analysisApplicability.js';
import { deleteLeafImageFromStorage } from '../services/objectStorage.js';

async function run(): Promise<void> {
  const dbCollections = await collections();

  const leaves = await dbCollections.leaves
    .find(
      {},
      {
        projection: {
          leafId: 1,
          commonName: 1,
          scientificName: 1,
          imageStorageKey: 1
        }
      }
    )
    .toArray();

  const invalidLeaves = leaves.filter(
    (leaf) =>
      !isApplicableLeafRecord({
        commonName: leaf.commonName,
        scientificName: leaf.scientificName
      })
  );

  if (invalidLeaves.length === 0) {
    console.log('No non-applicable leaf records found.');
    return;
  }

  const invalidLeafIds = invalidLeaves.map((leaf) => leaf.leafId);
  let deletedImages = 0;
  let imageDeleteErrors = 0;

  for (const leaf of invalidLeaves) {
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

  const deleteResult = await dbCollections.leaves.deleteMany({
    leafId: { $in: invalidLeafIds }
  });

  const updateCollectionsResult = await dbCollections.leafCollections.updateMany(
    { leafIds: { $in: invalidLeafIds } },
    {
      $pull: {
        leafIds: {
          $in: invalidLeafIds
        }
      },
      $set: {
        updatedAt: new Date()
      }
    }
  );

  console.log(
    `Deleted ${deleteResult.deletedCount} non-applicable records. Removed ${deletedImages} stored images. ` +
      `Updated ${updateCollectionsResult.modifiedCount} collections.`
  );

  if (imageDeleteErrors > 0) {
    console.log(`Image delete errors: ${imageDeleteErrors}`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
