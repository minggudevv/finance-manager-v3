-- Make Admin Script
-- Use this script to grant admin privileges to a specific user by UUID or email

-- Primary method: Using user UUID (recommended)
-- Example usage:
-- SELECT * FROM grant_admin_privileges_by_uid('12345678-1234-1234-1234-123456789012');

-- Convenience method: Using email (will look up UUID internally)
-- Example usage:
-- SELECT * FROM grant_admin_privileges('admin@example.com');

-- To make a user an admin by UUID:
-- SELECT * FROM grant_admin_privileges_by_uid('user-uuid-here');

-- To make a user an admin by email:
-- SELECT * FROM grant_admin_privileges('user@example.com');

-- To revoke admin privileges by UUID:
-- SELECT * FROM revoke_admin_privileges_by_uid('user-uuid-here');

-- To revoke admin privileges by email:
-- SELECT * FROM revoke_admin_privileges('user@example.com');

-- To see all admins:
-- SELECT * FROM get_all_admins();

-- Find user UUID from email:
-- SELECT id FROM auth.users WHERE email = 'user@example.com';

-- For security reasons, this should typically only be run by database administrators
-- or through your application's admin interface after proper authentication.