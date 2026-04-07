CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaf (
    leaf_id BIGSERIAL PRIMARY KEY,
    common_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    origin TEXT,
    usage TEXT,
    habitat TEXT,
    image_data BYTEA,
    image_filename VARCHAR(255),
    image_content_type VARCHAR(100),
    image_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaf_collection (
    collection_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    collection_name VARCHAR(255) DEFAULT 'My Collection',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_leaf_collection_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE collection_leaf (
    collection_id BIGINT NOT NULL,
    leaf_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Composite primary key
    PRIMARY KEY (collection_id, leaf_id),

    -- Foreign key constraints
    CONSTRAINT fk_collection_leaf_collection
        FOREIGN KEY (collection_id)
        REFERENCES leaf_collection(collection_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_collection_leaf_leaf
        FOREIGN KEY (leaf_id)
        REFERENCES leaf(leaf_id)
        ON DELETE CASCADE
);


--indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_leaf_scientific_name ON leaf(scientific_name);
CREATE INDEX idx_leaf_common_name ON leaf(common_name);
CREATE INDEX idx_leaf_created_at ON leaf(created_at);
CREATE INDEX idx_leaf_common_scientific ON leaf(common_name, scientific_name);

CREATE INDEX idx_leaf_collection_user_id ON leaf_collection(user_id);
CREATE INDEX idx_leaf_collection_created_at ON leaf_collection(created_at);

CREATE INDEX idx_collection_leaf_collection_id ON collection_leaf(collection_id);
CREATE INDEX idx_collection_leaf_leaf_id ON collection_leaf(leaf_id);
CREATE INDEX idx_collection_leaf_added_at ON collection_leaf(added_at);