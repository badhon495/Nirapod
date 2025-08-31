-- Fix all column length issues in usr_user table

-- Check current structure and all varchar columns with length restrictions
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE 
    table_name = 'usr_user' 
    AND data_type = 'character varying'
    AND character_maximum_length IS NOT NULL
ORDER BY character_maximum_length;

-- Fix the NID column (currently 10, should be 17)
ALTER TABLE usr_user ALTER COLUMN nid TYPE varchar(17);

-- Fix any other columns that might be too short
-- Let's also check if categories column has proper length (should be 16)
ALTER TABLE usr_user ALTER COLUMN categories TYPE varchar(16);

-- Show the updated structure to verify changes
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE 
    table_name = 'usr_user' 
    AND data_type = 'character varying'
    AND character_maximum_length IS NOT NULL
ORDER BY character_maximum_length;
