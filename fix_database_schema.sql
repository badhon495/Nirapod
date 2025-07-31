-- Database schema fix for the signup error
-- Run this on your deployed PostgreSQL database to fix the column size issues

-- First, let's check the current schema
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usr_user' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fix the NID column - increase size to accommodate longer IDs
ALTER TABLE usr_user ALTER COLUMN nid TYPE VARCHAR(17);

-- Fix the phone column if it exists and has length restrictions
-- Check if phone column exists and its current type
DO $$
BEGIN
    -- Check if phone column needs to be resized
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usr_user' 
        AND column_name = 'phone' 
        AND character_maximum_length < 15
    ) THEN
        ALTER TABLE usr_user ALTER COLUMN phone TYPE VARCHAR(15);
    END IF;
END $$;

-- If you want to be extra safe, you can also increase other text columns that might be too small
-- Uncomment these lines if needed:

-- ALTER TABLE usr_user ALTER COLUMN name TYPE VARCHAR(255);
-- ALTER TABLE usr_user ALTER COLUMN email TYPE VARCHAR(255);
-- ALTER TABLE usr_user ALTER COLUMN present_address TYPE TEXT;
-- ALTER TABLE usr_user ALTER COLUMN permanent_address TYPE TEXT;
-- ALTER TABLE usr_user ALTER COLUMN passport TYPE VARCHAR(50);
-- ALTER TABLE usr_user ALTER COLUMN driving_license TYPE VARCHAR(50);
-- ALTER TABLE usr_user ALTER COLUMN utility_bill_customer_id TYPE VARCHAR(100);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usr_user' 
AND table_schema = 'public'
AND column_name IN ('nid', 'phone', 'name', 'email')
ORDER BY ordinal_position;
