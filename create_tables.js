const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'nirapod',
  password: 'postgres',
  port: 5432,
});

async function createTables() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "usr_user" (
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

    CREATE TABLE IF NOT EXISTS "usr_complain" (
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
      Status INTEGER NOT NULL DEFAULT 0,
      Follow TEXT,
      Comment TEXT,
      Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      Report TEXT
    );
  `);
  await client.end();
  console.log('Tables created successfully.');
}

createTables().catch(console.error);