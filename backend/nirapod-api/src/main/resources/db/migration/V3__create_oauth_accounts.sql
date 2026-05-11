CREATE TABLE oauth_accounts (
    provider    VARCHAR(50)  NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (provider, provider_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
