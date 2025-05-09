#!/bin/bash

# Config
DB_NAME="nirapod"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
DB_PASS="postgres"

export PGPASSWORD=$DB_PASS

# Drop the database if it already exists
DB_EXISTS=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" = "1" ]; then
  echo "Database $DB_NAME exists. Terminating connections..."
  psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
  echo "Dropping database $DB_NAME..."
  dropdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME
fi

echo "Creating PostgreSQL database..."
createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME

echo "Creating tables in $DB_NAME..."

psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME <<EOF

CREATE TABLE "usr_user" (
    NID CHAR(10) PRIMARY KEY,
    Categories VARCHAR(16) NOT NULL,
    Email TEXT NOT NULL,
    Password TEXT NOT NULL,
    Name TEXT NOT NULL,
    Phone NUMERIC(11) NOT NULL,
    Present_address TEXT NOT NULL,
    Permanent_address TEXT NOT NULL,
    Passport TEXT,
    Passport_img TEXT,
    Driving_License TEXT,
    Driving_License_img TEXT,
    Utility_bill_customer_ID TEXT NOT NULL,
    Utility_bill_photo TEXT NOT NULL,
    User_photo TEXT NOT NULL,
    NID_photo TEXT NOT NULL,
    priv_user_ID TEXT,
    priv_user_ID_photo TEXT
);

CREATE TABLE "usr_complain" (
    tracking_ID SERIAL PRIMARY KEY,
    NID CHAR(10) REFERENCES "usr_user"(NID),
    Urgency TEXT NOT NULL,
    Complain_to TEXT NOT NULL,
    District TEXT NOT NULL,
    Area TEXT NOT NULL,
    Tags TEXT NOT NULL,
    Details TEXT NOT NULL,
    Photos TEXT NOT NULL,
    Post_on_timeline BOOLEAN NOT NULL,
    Location TEXT,
    Update TEXT,
    Status INTEGER NOT NULL DEFAULT 0, -- 0: unsolved, 1: in progress, 2: solved
    Follow TEXT, -- Comma separated NIDs
    Comment TEXT, -- Key-value pairs: NID:comment
    Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated time
    Report TEXT -- Comma separated NIDs of users who reported this post, NULL at first
);

CREATE TABLE "notifications" (
    id BIGSERIAL PRIMARY KEY,
    user_id CHAR(10) REFERENCES "usr_user"(NID) ON DELETE CASCADE,
    message TEXT NOT NULL,
    related_post_id INTEGER REFERENCES "usr_complain"(tracking_ID) ON DELETE CASCADE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

EOF

echo "\n# Usr_complain.Status: 0 = unsolved, 1 = in progress, 2 = solved"
echo "✅ Setup complete!"