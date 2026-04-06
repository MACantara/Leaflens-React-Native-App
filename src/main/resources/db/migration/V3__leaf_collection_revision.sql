-- Move join rows from duplicate collections to the kept one (latest by created_at, then highest id)
WITH keep AS (
  SELECT user_id, collection_id AS keep_id
  FROM (
    SELECT lc.*,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY created_at DESC NULLS LAST, collection_id DESC
           ) rn
    FROM leaf_collection lc
  ) s
  WHERE rn = 1
),
dups AS (
  SELECT lc.user_id, lc.collection_id AS dup_id, k.keep_id
  FROM leaf_collection lc
  JOIN keep k USING (user_id)
  WHERE lc.collection_id <> k.keep_id
)
UPDATE collection_leaf cl
SET collection_id = d.keep_id
FROM dups d
WHERE cl.collection_id = d.dup_id;

-- Remove duplicate (collection_id, leaf_id) pairs that may have been created
DELETE FROM collection_leaf cl
USING (
  SELECT MIN(ctid) AS keep_ctid, leaf_id, collection_id
  FROM collection_leaf
  GROUP BY leaf_id, collection_id
) k
WHERE cl.leaf_id = k.leaf_id
  AND cl.collection_id = k.collection_id
  AND cl.ctid <> k.keep_ctid;

-- Delete the now-empty duplicate collections (redefine CTEs for this statement)
WITH keep AS (
  SELECT user_id, collection_id AS keep_id
  FROM (
    SELECT lc.*,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY created_at DESC NULLS LAST, collection_id DESC
           ) rn
    FROM leaf_collection lc
  ) s
  WHERE rn = 1
),
dups AS (
  SELECT lc.user_id, lc.collection_id AS dup_id, k.keep_id
  FROM leaf_collection lc
  JOIN keep k USING (user_id)
  WHERE lc.collection_id <> k.keep_id
)
DELETE FROM leaf_collection lc
USING dups d
WHERE lc.collection_id = d.dup_id;

-- Enforce one-to-one: NOT NULL + UNIQUE + FK (idempotent)
ALTER TABLE leaf_collection
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_leaf_collection_user') THEN
    ALTER TABLE leaf_collection ADD CONSTRAINT uk_leaf_collection_user UNIQUE (user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leaf_collection_user') THEN
    ALTER TABLE leaf_collection
      ADD CONSTRAINT fk_leaf_collection_user
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;
END$$;