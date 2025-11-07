-- Finance Manager Database Schema - v1.0.0
-- Stable version as of 2025-11-02

-- 01_profiles_transactions.sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin = TRUE OR auth.uid() = id);

-- Admin policy: Admins can update any profile
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (is_admin = TRUE OR auth.uid() = id)
  WITH CHECK (is_admin = TRUE OR auth.uid() = id);

-- Create updated_at trigger function for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'receivable')),
  amount DECIMAL(15, 2) NOT NULL,
  category TEXT,
  description TEXT,
  date DATE NOT NULL,
  counterparty_name TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for transactions
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 02_products_orders.sql
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

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 03_views.sql
-- Drop existing view if it exists
DROP VIEW IF EXISTS dashboard_summary CASCADE;

-- Create dashboard_summary view
CREATE VIEW dashboard_summary AS
SELECT 
  user_id,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0) as total_debt,
  COALESCE(SUM(CASE WHEN type = 'receivable' THEN amount ELSE 0 END), 0) as total_receivable,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as net_balance
FROM transactions
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON dashboard_summary TO authenticated;

-- Enable RLS on the view
ALTER VIEW dashboard_summary SET (security_invoker=true);

-- 04_functions.sql
-- Function to get monthly summary
CREATE OR REPLACE FUNCTION get_monthly_summary(user_uuid UUID, year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
  total_income DECIMAL,
  total_expense DECIMAL,
  total_debt DECIMAL,
  total_receivable DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'receivable' THEN amount ELSE 0 END), 0)::DECIMAL
  FROM transactions
  WHERE user_id = user_uuid
    AND EXTRACT(YEAR FROM date) = year_param
    AND EXTRACT(MONTH FROM date) = month_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 05_functions_additional.sql
-- Function to get dashboard summary for a specific user
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_income DECIMAL,
  total_expense DECIMAL,
  total_debt DECIMAL,
  total_receivable DECIMAL,
  net_balance DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.user_id,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_debt,
    COALESCE(SUM(CASE WHEN t.type = 'receivable' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_receivable,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL as net_balance
  FROM transactions t
  WHERE t.user_id = p_user_id
  GROUP BY t.user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_dashboard_summary IS 'Get dashboard summary for a specific user, respecting RLS policies';

-- 06_public_tracking.sql
-- Public tracking function returning limited fields
CREATE OR REPLACE FUNCTION public_get_order_by_tracking(p_tracking TEXT)
RETURNS TABLE (
  tracking_number TEXT,
  customer_name TEXT,
  product_name TEXT,
  quantity INTEGER,
  status TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.tracking_number, o.customer_name, p.name as product_name, o.quantity, o.status, o.updated_at
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.tracking_number IS NOT NULL
    AND TRIM(o.tracking_number) ILIKE TRIM(p_tracking)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public_get_order_by_tracking(TEXT) TO anon, authenticated;

-- 07_site_settings.sql
-- Site Settings Table
-- This table stores global site configuration settings

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

-- 08_admin_management.sql
-- Admin management functions (defined after tables exist)
-- Function to grant admin privileges to a user by UUID
CREATE OR REPLACE FUNCTION grant_admin_privileges_by_uid(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    is_admin BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_message TEXT;
BEGIN
    -- Check if the user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        result_message := 'User with ID ' || target_user_id::TEXT || ' not found';
        RETURN QUERY
        SELECT target_user_id, NULL::TEXT, FALSE, result_message;
    ELSE
        -- Insert or update the profile with admin rights
        INSERT INTO profiles (id, name, is_admin)
        VALUES (target_user_id, (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = target_user_id), TRUE)
        ON CONFLICT (id)
        DO UPDATE SET is_admin = TRUE;
        
        result_message := 'Admin privileges granted to user ' || target_user_id::TEXT;
        RETURN QUERY
        SELECT target_user_id, (SELECT name FROM profiles WHERE id = target_user_id), TRUE, result_message;
    END IF;
END;
$$;

-- Function to revoke admin privileges from a user by UUID
CREATE OR REPLACE FUNCTION revoke_admin_privileges_by_uid(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    is_admin BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_message TEXT;
BEGIN
    -- Check if the user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        result_message := 'User with ID ' || target_user_id::TEXT || ' not found';
        RETURN QUERY
        SELECT target_user_id, NULL::TEXT, FALSE, result_message;
    ELSE
        -- Update the profile to remove admin rights
        UPDATE profiles
        SET is_admin = FALSE
        WHERE id = target_user_id;
        
        result_message := 'Admin privileges revoked from user ' || target_user_id::TEXT;
        RETURN QUERY
        SELECT target_user_id, (SELECT name FROM profiles WHERE id = target_user_id), FALSE, result_message;
    END IF;
END;
$$;

-- Function to grant admin privileges to a user by email (convenience function)
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
        -- Use the UUID-based function
        RETURN QUERY SELECT * FROM grant_admin_privileges_by_uid(target_user_id);
    END IF;
END;
$$;

-- Function to revoke admin privileges from a user by email (convenience function)
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
        -- Use the UUID-based function
        RETURN QUERY SELECT * FROM revoke_admin_privileges_by_uid(target_user_id);
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
GRANT EXECUTE ON FUNCTION grant_admin_privileges_by_uid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin_privileges_by_uid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;


-- 02_products_orders.sql
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

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 03_views.sql
-- Drop existing view if it exists
DROP VIEW IF EXISTS dashboard_summary CASCADE;

-- Create dashboard_summary view
CREATE VIEW dashboard_summary AS
SELECT 
  user_id,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0) as total_debt,
  COALESCE(SUM(CASE WHEN type = 'receivable' THEN amount ELSE 0 END), 0) as total_receivable,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as net_balance
FROM transactions
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON dashboard_summary TO authenticated;

-- Enable RLS on the view
ALTER VIEW dashboard_summary SET (security_invoker=true);


-- 04_functions.sql
-- Function to get monthly summary
CREATE OR REPLACE FUNCTION get_monthly_summary(user_uuid UUID, year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
  total_income DECIMAL,
  total_expense DECIMAL,
  total_debt DECIMAL,
  total_receivable DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN type = 'receivable' THEN amount ELSE 0 END), 0)::DECIMAL
  FROM transactions
  WHERE user_id = user_uuid
    AND EXTRACT(YEAR FROM date) = year_param
    AND EXTRACT(MONTH FROM date) = month_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 05_functions_additional.sql
-- Function to get dashboard summary for a specific user
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_income DECIMAL,
  total_expense DECIMAL,
  total_debt DECIMAL,
  total_receivable DECIMAL,
  net_balance DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.user_id,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_debt,
    COALESCE(SUM(CASE WHEN t.type = 'receivable' THEN t.amount ELSE 0 END), 0)::DECIMAL as total_receivable,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL as net_balance
  FROM transactions t
  WHERE t.user_id = p_user_id
  GROUP BY t.user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_dashboard_summary IS 'Get dashboard summary for a specific user, respecting RLS policies';


-- 06_public_tracking.sql
-- Public tracking function returning limited fields
CREATE OR REPLACE FUNCTION public_get_order_by_tracking(p_tracking TEXT)
RETURNS TABLE (
  tracking_number TEXT,
  customer_name TEXT,
  product_name TEXT,
  quantity INTEGER,
  status TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.tracking_number, o.customer_name, p.name as product_name, o.quantity, o.status, o.updated_at
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.tracking_number IS NOT NULL
    AND TRIM(o.tracking_number) ILIKE TRIM(p_tracking)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public_get_order_by_tracking(TEXT) TO anon, authenticated;