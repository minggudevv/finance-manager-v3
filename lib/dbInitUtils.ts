// Database Initialization Utility
// Helper functions to ensure database tables are properly initialized

import { supabase } from '@/lib/supabaseClient';
import { isAdmin } from '@/lib/adminUtils';

/**
 * Initialize the app_settings table with default values if it doesn't exist
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function initializeAppSettings(): Promise<boolean> {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      console.warn('Only admin users can initialize app settings');
      return false;
    }

    // Try to insert default settings
    const { error } = await supabase
      .from('app_settings')
      .upsert([{
        id: 1,
        allow_registration: true,
        site_name: 'Finance Manager',
        site_description: 'Aplikasi pengelola keuangan',
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { 
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error initializing app settings:', error?.message || error);
      return false;
    }

    console.log('App settings initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing app settings:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Check if the app_settings table exists and has data
 * @returns Promise resolving to true if table exists and has data, false otherwise
 */
export async function checkAppSettingsExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();

    if (error) {
      // Handle different error types
      if (error.code === '42P01') { // Undefined table
        console.warn('app_settings table does not exist');
        return false;
      } else if (error.code === 'PGRST116') { // No rows returned
        console.log('app_settings table exists but is empty');
        return false;
      }
      console.error('Error checking app_settings table:', error?.message || error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking app settings existence:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Create the app_settings table if it doesn't exist
 * Note: This function requires database admin privileges and should be run in Supabase SQL editor
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function createAppSettingsTable(): Promise<boolean> {
  try {
    // This would typically be done through SQL, but we can check if it exists
    const { error } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.warn('app_settings table does not exist. Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Create the app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Single row table (always id = 1)
  allow_registration BOOLEAN DEFAULT TRUE,
  site_name TEXT DEFAULT 'Finance Manager',
  site_description TEXT DEFAULT 'Aplikasi pengelola keuangan',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO app_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only authenticated users to read (for public info)
CREATE POLICY "Allow read for authenticated users" ON app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Create policy to allow only admins to update
CREATE POLICY "Allow update for admins only" ON app_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking app_settings table:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Check if the profiles table has the is_admin column
 * @returns Promise resolving to true if the column exists, false otherwise
 */
export async function checkProfilesAdminColumn(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .limit(1);

    if (error) {
      if (error.code === '42703') { // Undefined column
        console.warn('is_admin column missing from profiles table');
        return false;
      }
      console.error('Error checking profiles is_admin column:', error?.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking profiles admin column:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Create a health check function to identify all missing components
 * @returns Object containing status of various database components
 */
export async function runDatabaseHealthCheck() {
  const health = {
    profilesTable: true,
    transactionsTable: true,
    productsTable: true,
    ordersTable: true,
    appSettingsTable: true,
    isProfilesAdminColumn: true
  };

  try {
    // Check each table and column
    const profilesCheck = await supabase.from('profiles').select('id').limit(1);
    health.profilesTable = !profilesCheck.error;

    const transactionsCheck = await supabase.from('transactions').select('id').limit(1);
    health.transactionsTable = !transactionsCheck.error;

    const productsCheck = await supabase.from('products').select('id').limit(1);
    health.productsTable = !productsCheck.error;

    const ordersCheck = await supabase.from('orders').select('id').limit(1);
    health.ordersTable = !ordersCheck.error;

    const settingsCheck = await supabase.from('app_settings').select('id').limit(1);
    health.appSettingsTable = !settingsCheck.error;

    if (health.profilesTable) {
      const adminColumnCheck = await supabase.from('profiles').select('id, is_admin').limit(1);
      health.isProfilesAdminColumn = !adminColumnCheck.error;
    }

    console.log('Database health check results:', health);
    return health;
  } catch (error) {
    console.error('Error running database health check:', error instanceof Error ? error.message : error);
    return health;
  }
}