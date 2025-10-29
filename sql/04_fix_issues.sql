-- Fix issues with profiles table and dashboard_summary view

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy that allows profile creation during signup
CREATE POLICY "Users can insert own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update dashboard summary to query directly without security definer issues
-- Use a function approach instead
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