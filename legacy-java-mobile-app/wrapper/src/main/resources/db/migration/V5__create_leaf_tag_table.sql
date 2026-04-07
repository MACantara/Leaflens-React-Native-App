CREATE TABLE leaf_tag (
    leaf_id BIGINT NOT NULL REFERENCES leaf(leaf_id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tag(tag_id)  ON DELETE CASCADE,
    PRIMARY KEY (leaf_id, tag_id)
);