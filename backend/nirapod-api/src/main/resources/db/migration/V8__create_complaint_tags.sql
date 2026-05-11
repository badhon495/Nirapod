CREATE TABLE complaint_tags (
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    tag          VARCHAR(100) NOT NULL,
    PRIMARY KEY (complaint_id, tag)
);
