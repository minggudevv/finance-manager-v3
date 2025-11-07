-- Fix RLS Policies for app_settings table
-- This script fixes the 403 Forbidden error when saving settings

-- First, let's check if the row exists, and if not, we'll handle it properly
-- We need to make sure the initial row exists for app_settings

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow read for authenticated users" ON app_settings;
DROP POLICY IF EXISTS "Allow update for admins only" ON app_settings;
DROP POLICY IF EXISTS "Allow service role insert" ON app_settings;

-- Create policy to allow authenticated users to read (for public info)
CREATE POLICY "Allow read for authenticated users" ON app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert (for initial setup by admin)
-- We need to be specific about when insert is allowed
CREATE POLICY "Allow authenticated users to insert initial row" ON app_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    id = 1 AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create policy to allow only admins to update
CREATE POLICY "Allow admin update on app_settings" ON app_settings
  FOR UPDATE TO authenticated
  USING (id = 1)  -- Only allow update on the single settings row
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create policy to allow admins to delete (though they shouldn't in practice)
CREATE POLICY "Allow admin delete on app_settings" ON app_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Additionally, create a specific RLS policy for service_role to manage this table during setup
CREATE POLICY "Allow service role full access" ON app_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Make sure we have the initial row
INSERT INTO app_settings (id, allow_registration, site_name, site_description, maintenance_mode)
SELECT 1, true, 'Finance Manager', 'Aplikasi pengelola keuangan', false
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1);