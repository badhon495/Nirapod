CREATE TABLE complaints (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id    BIGSERIAL UNIQUE NOT NULL,
    user_id        UUID NOT NULL REFERENCES users(id),
    category       VARCHAR(20) NOT NULL,
    urgency        VARCHAR(10) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'UNSOLVED',
    title          VARCHAR(500) NOT NULL,
    details        TEXT NOT NULL,
    district       VARCHAR(100) NOT NULL,
    area           VARCHAR(100) NOT NULL,
    location_lat   DECIMAL(10,8),
    location_lng   DECIMAL(11,8),
    location_text  TEXT,
    is_public      BOOLEAN NOT NULL DEFAULT TRUE,
    authority_note TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at    TIMESTAMPTZ
);

CREATE INDEX idx_complaints_category_status ON complaints(category, status, created_at DESC);
CREATE INDEX idx_complaints_user_id         ON complaints(user_id);
CREATE INDEX idx_complaints_district        ON complaints(district);
