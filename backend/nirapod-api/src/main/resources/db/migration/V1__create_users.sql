CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nid               CHAR(10)    UNIQUE NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    phone             VARCHAR(20)  UNIQUE NOT NULL,
    password_hash     TEXT,
    name              VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'CITIZEN',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    present_address   TEXT         NOT NULL,
    permanent_address TEXT         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nid   ON users(nid);
