-- Script to backup and then delete all rows from all tables
-- This version creates backups before deletion for safety

-- Create backup tables with current data
CREATE TABLE usr_user_backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM usr_user;
CREATE TABLE usr_complain_backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM usr_complain;
CREATE TABLE notifications_backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM notifications;

SELECT 'Backup tables created successfully' as backup_status;

-- Now proceed with deletion
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all data from tables
DELETE FROM notifications;
DELETE FROM usr_complain;
DELETE FROM usr_user;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS usr_complain_tracking_id_seq RESTART WITH 1;

-- Show final verification
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

SELECT 'Database cleanup with backup completed!' as final_status;
