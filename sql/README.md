# SQL Schema Setup

## Installation Steps

1. Login to your Supabase project
2. Go to SQL Editor
3. Run the SQL files in order:
   - `01_tables.sql` - Creates tables and RLS policies
   - `02_views.sql` - Creates dashboard views
   - `03_functions.sql` - Creates helper functions

## Tables

### profiles
- Stores user profile information (name, timestamps)
- Linked to auth.users

### transactions
- Stores all financial transactions
- Types: income, expense, debt, receivable
- RLS enabled for data isolation

## Views

### dashboard_summary
- Aggregates transaction totals per user
- Shows income, expense, debt, receivable
- Calculates net balance

## Functions

### get_monthly_summary
- Returns monthly transaction summary for a user
- Parameters: user_uuid, year, month
