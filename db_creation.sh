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

echo "Creating tables and inserting data in $DB_NAME..."

USER_INSERTS=""
COMPLAIN_INSERTS=""
for i in {1..10}
do
  NID=$(shuf -i 1000000000-9999999999 -n 1)
  CATEGORIES="user"
  EMAIL="user${i}@example.com"
  PASSWORD="postgres"
  NAME="User $i"
  P_ADDRESS="${i} Main St, City"
  PERM_ADDRESS="${i} Permanent St, City"
  PASSPORT="P$(shuf -i 10000000-99999999 -n 1)"
  DL="DL$(shuf -i 100000000-999999999 -n 1)"
  UTIL_ID="U$(shuf -i 100000-999999 -n 1)"
  IMG_URL="https://via.placeholder.com/150"
  PHONE="0170000000${i}"
  # Ensure PHONE is numeric and 11 digits
  PHONE_NUM=$(printf "%011d" $((17000000000 + $i)))
  FOLLOW="${NID},1234567890,9876543210"
  PHOTOS="{\"$NID\": [\"$IMG_URL\", \"$IMG_URL\"]}"
  COMMENT="{\"$NID\": \"Sample comment by user $i\"}"

  USER_INSERTS+="INSERT INTO \"usr_user\" (
    NID, Categories, Email, Password, Name, Present_address,
    Permanent_address, Phone, Passport, Passport_img, Driving_License,
    Driving_License_img, Utility_bill_customer_ID, Utility_bill_photo,
    User_photo, NID_photo, priv_user_ID, priv_user_ID_photo
  ) VALUES (
    '$NID', '$CATEGORIES', '$EMAIL', '$PASSWORD',
    '$NAME', '$P_ADDRESS', '$PERM_ADDRESS', $PHONE_NUM, '$PASSPORT', '$IMG_URL',
    '$DL', '$IMG_URL', '$UTIL_ID', '$IMG_URL', '$IMG_URL', '$IMG_URL',
    NULL, NULL
  );"

  COMPLAIN_INSERTS+="INSERT INTO \"usr_complain\" (
    NID, Urgency, Complain_to, District, Area, Tags,
    Details, Photos, Post_on_timeline, Location, Update, Status, Follow, Comment
  ) VALUES (
    '$NID', 'High', 'Police', 'Dhaka', 'Dhanmondi', 'safety,crime',
    'Details about the complaint including text and numbers: 1234.',
    '$IMG_URL', true, '23.8103,90.4125', '2025-04-20 10:30:00 - Suspect spotted', 0,
    '$FOLLOW', '$COMMENT'
  );"
done

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

$USER_INSERTS
$COMPLAIN_INSERTS

EOF

echo "\n# Usr_complain.Status: 0 = unsolved, 1 = in progress, 2 = solved"
echo "✅ Setup complete!"
