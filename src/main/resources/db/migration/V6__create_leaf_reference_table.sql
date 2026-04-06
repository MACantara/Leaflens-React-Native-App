CREATE TABLE leaf_reference (
    reference_id BIGSERIAL PRIMARY KEY,
    leaf_id      BIGINT       NOT NULL REFERENCES leaf(leaf_id) ON DELETE CASCADE,
    url          VARCHAR(2048) NOT NULL,
    title        VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
