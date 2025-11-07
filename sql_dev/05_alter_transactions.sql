-- Alter transactions table to add optional fields for debt/receivable details
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS counterparty_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- No policy changes needed; existing RLS continues to apply
