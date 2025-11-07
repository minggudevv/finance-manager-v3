-- Admin Management Script
-- This script provides functions to manage admin privileges in the Finance Manager application
-- Use this script to grant admin rights to specific users

-- Function to grant admin privileges to a user by email
CREATE OR REPLACE FUNCTION grant_admin_privileges(target_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    is_admin BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result_message TEXT;
BEGIN
    -- Get the user ID based on email
    SELECT auth.users.id INTO target_user_id
    FROM auth.users
    WHERE auth.users.email = target_email;
    
    IF target_user_id IS NULL THEN
        result_message := 'User with email ' || target_email || ' not found';
        RETURN QUERY
        SELECT NULL::UUID, target_email, FALSE, result_message;
    ELSE
        -- Insert or update the profile with admin rights
        INSERT INTO profiles (id, name, is_admin)
        VALUES (target_user_id, (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = target_user_id), TRUE)
        ON CONFLICT (id)
        DO UPDATE SET is_admin = TRUE;
        
        result_message := 'Admin privileges granted to ' || target_email;
        RETURN QUERY
        SELECT target_user_id, target_email, TRUE, result_message;
    END IF;
END;
$$;

-- Function to revoke admin privileges from a user by email
CREATE OR REPLACE FUNCTION revoke_admin_privileges(target_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    is_admin BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result_message TEXT;
BEGIN
    -- Get the user ID based on email
    SELECT auth.users.id INTO target_user_id
    FROM auth.users
    WHERE auth.users.email = target_email;
    
    IF target_user_id IS NULL THEN
        result_message := 'User with email ' || target_email || ' not found';
        RETURN QUERY
        SELECT NULL::UUID, target_email, FALSE, result_message;
    ELSE
        -- Update the profile to remove admin rights
        UPDATE profiles
        SET is_admin = FALSE
        WHERE id = target_user_id;
        
        result_message := 'Admin privileges revoked from ' || target_email;
        RETURN QUERY
        SELECT target_user_id, target_email, FALSE, result_message;
    END IF;
END;
$$;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email,
        p.name,
        p.is_admin,
        p.created_at
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.is_admin = TRUE
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION grant_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;

-- Update RLS policy to include admin access
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy that allows users to update own profile, and admins to update any profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);