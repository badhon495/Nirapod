CREATE TABLE complaint_status_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by   UUID NOT NULL REFERENCES users(id),
    old_status   VARCHAR(20) NOT NULL,
    new_status   VARCHAR(20) NOT NULL,
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_complaint ON complaint_status_history(complaint_id, created_at DESC);
