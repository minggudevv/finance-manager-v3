# Database Version Control

This folder contains stable, versioned database schema files for the Finance Manager application.

## Versioning System

- Each version is stored as `vX.Y.Z.sql` (e.g., v1.0.0.sql)
- Each version includes all necessary database schema changes
- Each version contains migration instructions from the previous version
- Version numbers follow semantic versioning (MAJOR.MINOR.PATCH)
- All versions are backward compatible when possible

## Current stable version: v1.0.0

## Version History

| Version | Date | Description | Applied |
|---------|------|-------------|---------|
| v1.0.0 | 2025-11-02 | Initial stable schema with admin functionality | Yes |

## Admin Management

The database includes admin management functionality:

- `is_admin` column in the `profiles` table to identify admin users
- Functions to grant/revoke admin privileges by UUID (primary method):
  - `grant_admin_privileges_by_uid(uuid)` - Grant admin rights to a user by UUID
  - `revoke_admin_privileges_by_uid(uuid)` - Revoke admin rights from a user by UUID
- Convenience functions using email (looks up UUID internally):
  - `grant_admin_privileges(email)` - Grant admin rights using email
  - `revoke_admin_privileges(email)` - Revoke admin rights using email
  - `get_all_admins()` - List all admin users
- Admin-specific policies that allow admin users to manage application features
- The `make_admin.sql` script provides examples for managing admin users
- Both UUID-based and email-based methods are available for admin management

## Site Settings

The database includes a site settings table:

- `app_settings` table to store global application configuration
- Single-row table (id=1) containing settings like `allow_registration`, `site_name`, etc.
- Row Level Security with policies allowing only admins to modify settings
- Settings include registration toggle, maintenance mode, and site information
- The `site_settings.sql` file contains the table definition and policies

## Complete Database Initialization

For new installations, use the `init_complete.sql` script which contains all necessary tables, views, functions, and policies in a single file:

- Profiles, transactions, products, and orders tables
- App settings table for site configuration
- Dashboard views and summary functions
- Admin management functions and policies
- All necessary Row Level Security policies
- Proper triggers for updated_at columns