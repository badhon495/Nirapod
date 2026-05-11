CREATE TABLE complaint_follows (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, complaint_id)
);

CREATE INDEX idx_complaint_follows_user ON complaint_follows(user_id);
