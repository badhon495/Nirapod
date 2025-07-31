-- Test script to check the actual schema of usr_user table
-- Run this on your deployed database to see the actual column definitions

\d "usr_user"

-- Check for any columns with character varying(10) constraint
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usr_user' 
AND table_schema = 'public'
ORDER BY ordinal_position;
