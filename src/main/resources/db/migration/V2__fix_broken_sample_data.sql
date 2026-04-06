-- temporary table
CREATE TEMPORARY TABLE first_collections AS
SELECT user_id, MIN(collection_id) as main_collection_id
FROM leaf_collection
GROUP BY user_id;

--move existing data
UPDATE collection_leaf cl
SET collection_id = fc.main_collection_id
FROM leaf_collection lc, first_collections fc
WHERE cl.collection_id = lc.collection_id
  AND lc.user_id = fc.user_id
  AND lc.collection_id <> fc.main_collection_id;

--delete temp table
DELETE FROM leaf_collection
WHERE collection_id NOT IN (SELECT main_collection_id FROM first_collections);

DROP TABLE first_collections;