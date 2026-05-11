CREATE TABLE complaint_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    reporter_id  UUID NOT NULL REFERENCES users(id),
    reason       VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(complaint_id, reporter_id)
);

CREATE INDEX idx_complaint_reports_complaint ON complaint_reports(complaint_id);
CREATE INDEX idx_complaint_reports_reporter  ON complaint_reports(reporter_id);
