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
  echo "Database $DB_NAME exists. Dropping it..."
  dropdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME
fi

echo "Creating PostgreSQL database..."
createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME

echo "Creating tables in $DB_NAME..."

psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME <<EOF

CREATE TABLE "User" (
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

CREATE TABLE "Usr_complain" (
    tracking_ID SERIAL PRIMARY KEY,
    NID CHAR(10) REFERENCES "User"(NID),
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
    Status INTEGER NOT NULL DEFAULT 0 -- 0: unsolved, 1: in progress, 2: solved
);

EOF

echo "Inserting 10 fake users and complaints..."

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

  USER_INSERTS+="INSERT INTO \"User\" (
    NID, Categories, Email, Password, Name, Present_address,
    Permanent_address, Phone, Passport, Passport_img, Driving_License,
    Driving_License_img, Utility_bill_customer_ID, Utility_bill_photo,
    User_photo, NID_photo, priv_user_ID, priv_user_ID_photo
  ) VALUES (
    '$NID', '$CATEGORIES', '$EMAIL', '$PASSWORD',
    '$NAME', '$P_ADDRESS', '$PERM_ADDRESS', '$PHONE', '$PASSPORT', '$IMG_URL',
    '$DL', '$IMG_URL', '$UTIL_ID', '$IMG_URL', '$IMG_URL', '$IMG_URL',
    NULL, NULL
  );\n"

  COMPLAIN_INSERTS+="INSERT INTO \"Usr_complain\" (
    NID, Urgency, Complain_to, District, Area, Tags,
    Details, Photos, Post_on_timeline, Location, Update, Status
  ) VALUES (
    '$NID', 'High', 'Police', 'Dhaka', 'Dhanmondi', 'safety,crime',
    'Details about the complaint including text and numbers: 1234.',
    '$IMG_URL', true, '23.8103,90.4125', '2025-04-20 10:30:00 - Suspect spotted', 0
  );\n"
done

echo -e "$USER_INSERTS$COMPLAIN_INSERTS" > /tmp/nirapod_dummy_data.sql
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f /tmp/nirapod_dummy_data.sql

echo "\n# Usr_complain.Status: 0 = unsolved, 1 = in progress, 2 = solved"
echo "✅ Setup complete!"
