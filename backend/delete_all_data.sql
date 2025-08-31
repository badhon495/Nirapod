-- Script to delete all rows from all tables in the Nirapod database
-- Run this script to clean up all data

-- Disable foreign key checks temporarily (if any)
SET session_replication_role = replica;

-- Delete all data from tables (order matters for foreign key constraints)
-- Delete notifications first (likely no foreign keys pointing to it)
DELETE FROM notifications;
SELECT 'Deleted all rows from notifications table' as status;

-- Delete complaints/complains
DELETE FROM usr_complain;
SELECT 'Deleted all rows from usr_complain table' as status;

-- Delete users last (other tables might reference users)
DELETE FROM usr_user;
SELECT 'Deleted all rows from usr_user table' as status;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences (auto-increment IDs) back to 1
-- This ensures new records start from ID 1 again
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS usr_complain_tracking_id_seq RESTART WITH 1;

-- Show final counts to confirm deletion
SELECT 
    'usr_user' as table_name, 
    COUNT(*) as remaining_rows 
FROM usr_user
UNION ALL
SELECT 
    'usr_complain' as table_name, 
    COUNT(*) as remaining_rows 
FROM usr_complain
UNION ALL
SELECT 
    'notifications' as table_name, 
    COUNT(*) as remaining_rows 
FROM notifications;

SELECT 'Database cleanup completed successfully!' as final_status;
