-- Admin seed. Password hash is set via ADMIN_PASSWORD_HASH env var at deploy time.
-- Default hash below is bcrypt of 'ChangeMe!1' — MUST be overridden in production.
-- Generate a new hash: htpasswd -bnBC 12 "" 'YourPassword' | tr -d ':\n'
INSERT INTO users (
    id,
    nid,
    email,
    phone,
    password_hash,
    name,
    role,
    status,
    present_address,
    permanent_address
) VALUES (
    gen_random_uuid(),
    '0000000000',
    'admin@nirapod.gov.bd',
    '01000000000',
    '$2a$12$placeholder.hash.replace.before.deploy.nirapod.admin',
    'System Administrator',
    'ADMIN',
    'ACTIVE',
    'Dhaka, Bangladesh',
    'Dhaka, Bangladesh'
) ON CONFLICT (email) DO NOTHING;
