CREATE TABLE user_documents (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50)  NOT NULL,
    document_number VARCHAR(100),
    file_public_id  TEXT         NOT NULL,
    verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
