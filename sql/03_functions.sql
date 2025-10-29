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

