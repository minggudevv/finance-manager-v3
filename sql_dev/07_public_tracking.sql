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
