CREATE TABLE complaint_photos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id   UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_public_id TEXT NOT NULL,
    uploaded_by    UUID NOT NULL REFERENCES users(id),
    is_evidence    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaint_photos_complaint ON complaint_photos(complaint_id);
