import { collections } from '../db.js';

async function run(): Promise<void> {
  const dbCollections = await collections();

  const recordsWithReferences = await dbCollections.leaves.countDocuments({
    references: { $exists: true }
  });

  if (recordsWithReferences === 0) {
    console.log('No leaf records with references found.');
    return;
  }

  const now = new Date();
  const result = await dbCollections.leaves.updateMany(
    { references: { $exists: true } },
    {
      $unset: { references: '' },
      $set: { updatedAt: now }
    }
  );

  console.log(
    `Removed references from ${result.modifiedCount} leaf records (matched ${result.matchedCount}).`
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
