-- Drop existing view if it exists
DROP VIEW IF EXISTS dashboard_summary CASCADE;

-- Create dashboard_summary view without SECURITY DEFINER
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

