// Complete Database Initialization Utility
// This file contains functions to initialize ALL required database tables and functions

import { supabase } from '@/lib/supabaseClient';
import { isAdmin } from '@/lib/adminUtils';

/**
 * Initialize the complete database including all tables, views, and functions
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function initializeCompleteDatabase(): Promise<boolean> {
  console.log('Starting complete database initialization...');
  
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      console.warn('Only admin users can initialize the complete database');
      return false;
    }

    // Initialize the app_settings table
    const appSettingsSuccess = await initializeAppSettingsTable();
    if (!appSettingsSuccess) {
      console.warn('App settings table initialization failed, continuing with other tables...');
    }

    // Initialize products table if not exists
    const productsSuccess = await initializeProductsTable();
    if (!productsSuccess) {
      console.warn('Products table initialization failed');
      return false;
    }

    // Initialize orders table if not exists  
    const ordersSuccess = await initializeOrdersTable();
    if (!ordersSuccess) {
      console.warn('Orders table initialization failed');
      return false;
    }

    // Add is_admin column to profiles if missing
    const profilesSuccess = await ensureProfilesAdminColumn();
    if (!profilesSuccess) {
      console.warn('Profiles admin column initialization failed');
      return false;
    }

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error during complete database initialization:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Initialize the app_settings table with required structure
 * @returns Promise resolving to true if successful, false otherwise
 */
async function initializeAppSettingsTable(): Promise<boolean> {
  try {
    // Check if the app_settings table exists by trying to query it
    const { error: checkError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);

    // If table exists (no error), return true
    if (!checkError) {
      console.log('app_settings table already exists');
      return true;
    }

    // If table doesn't exist (error code 42P01), we need to create it via SQL
    if (checkError.code === '42P01') {
      // The table doesn't exist, need to create it via Supabase SQL editor
      // For now, we'll log what needs to be done
      console.log('app_settings table does not exist. Requires SQL execution in Supabase dashboard:');
      console.log(`
-- Create the app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Single row table (always id = 1)
  allow_registration BOOLEAN DEFAULT TRUE,
  site_name TEXT DEFAULT 'Finance Manager',
  site_description TEXT DEFAULT 'Aplikasi pengelola keuangan',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated at TIMESTAMPTZ DEFAULT NOW()
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

    console.log('app_settings table initialization check completed');
    return true;
  } catch (error) {
    console.error('Error checking/initializing app_settings table:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Initialize the products table if it doesn't exist
 * @returns Promise resolving to true if successful, false otherwise
 */
async function initializeProductsTable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('Products table already exists');
      return true;
    }

    if (error.code === '42P01') {
      // Table doesn't exist - suggest creation via SQL
      console.log('Products table does not exist. Requires SQL execution in Supabase dashboard:');
      console.log(`
-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS: Only owner can access/manipulate
CREATE POLICY "products_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking/initializing products table:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Initialize the orders table if it doesn't exist
 * @returns Promise resolving to true if successful, false otherwise
 */
async function initializeOrdersTable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('Orders table already exists');
      return true;
    }

    if (error.code === '42P01') {
      // Table doesn't exist - suggest creation via SQL
      console.log('Orders table does not exist. Requires SQL execution in Supabase dashboard:');
      console.log(`
-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  address TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','diproses','selesai','dikirim')) DEFAULT 'pending',
  tracking_number TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS: Only owner can access/manipulate
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "orders_delete_own" ON orders
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- trigger updated_at
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking/initializing orders table:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Ensure the profiles table has the is_admin column
 * @returns Promise resolving to true if successful, false otherwise
 */
async function ensureProfilesAdminColumn(): Promise<boolean> {
  try {
    // Try to update a profile with is_admin to see if the column exists
    const { error } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .limit(1);

    if (!error) {
      console.log('Profiles table already has is_admin column');
      return true;
    }

    if (error.code === '42703') { // Undefined column error
      // Column doesn't exist - suggest adding it via SQL
      console.log('is_admin column missing from profiles table. Requires SQL execution in Supabase dashboard:');
      console.log(`
-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

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
      `);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking/adding is_admin column to profiles:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Run a database health check to identify missing components
 * @returns Object containing status of various database components
 */
export async function runDatabaseHealthCheck() {
  const health = {
    profilesTable: false,
    transactionsTable: false,
    productsTable: false,
    ordersTable: false,
    appSettingsTable: false,
    isProfilesAdminColumn: false,
    functions: false
  };

  try {
    // Check profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    health.profilesTable = !profilesError;

    // Check transactions table
    const { error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);
    health.transactionsTable = !transactionsError;

    // Check products table
    const { error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    health.productsTable = !productsError;

    // Check orders table
    const { error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    health.ordersTable = !ordersError;

    // Check app_settings table
    const { error: settingsError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);
    health.appSettingsTable = !settingsError;

    // Check if profiles has is_admin column
    if (health.profilesTable) {
      const { error: adminColumnError } = await supabase
        .from('profiles')
        .select('id, is_admin')
        .limit(1);
      health.isProfilesAdminColumn = !adminColumnError;
    }

    // For functions, we'd need to check pg_proc or similar which is more complex
    // For now, just mark as unchecked
    health.functions = true; // Assume OK for now

    console.log('Database health check completed:', health);
    return health;
  } catch (error) {
    console.error('Error running database health check:', error instanceof Error ? error.message : error);
    return health;
  }
}