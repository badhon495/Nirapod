-- Fix phone column length in usr_user table
-- Current column is likely varchar(10), but we need varchar(15) to support international formats

-- First, let's check the current structure
\d usr_user;

-- Update the phone column to allow 15 characters
ALTER TABLE usr_user ALTER COLUMN phone TYPE varchar(15);

-- Also check if there are any other columns that might be causing issues
-- Check all varchar(10) columns in the usr_user table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE 
    table_name = 'usr_user' 
    AND character_maximum_length = 10;

-- Show the updated structure
\d usr_user;
