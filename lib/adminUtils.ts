// Admin Utility Functions
// Helper functions to check admin status and manage admin features

import { getCurrentUser } from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';

/**
 * Check if the current user has admin privileges
 * @returns Promise resolving to true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    // Query the profiles table to check if the user is an admin
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      // Check if the error is due to missing is_admin column
      if (error.code === '42703') { // Undefined column
        console.warn('is_admin column does not exist in profiles table. Admin features will be unavailable.');
        return false;
      }
      console.error('Error checking admin status:', error?.message || error);
      return false;
    }

    // If no profile exists for the user, they're not an admin
    if (!data) {
      return false;
    }

    return data.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Fetch user profile including admin status
 * @returns Promise resolving to profile data or null
 */
export async function getUserProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error?.message || error);
      return null;
    }

    // Return the profile data, which could be null if user doesn't have a profile
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Grant admin privileges to a user by email
 * @param email Email of the user to grant admin privileges to
 * @returns Promise resolving to the result of the operation
 */
export async function grantAdminPrivileges(email: string) {
  try {
    if (!(await isAdmin())) {
      throw new Error('Only admins can grant admin privileges');
    }

    const { data, error } = await supabase.rpc('grant_admin_privileges', { target_email: email });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error granting admin privileges:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Grant admin privileges to a user by UUID
 * @param userId UUID of the user to grant admin privileges to
 * @returns Promise resolving to the result of the operation
 */
export async function grantAdminPrivilegesByUid(userId: string) {
  try {
    if (!(await isAdmin())) {
      throw new Error('Only admins can grant admin privileges');
    }

    const { data, error } = await supabase.rpc('grant_admin_privileges_by_uid', { target_user_id: userId });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error granting admin privileges:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Revoke admin privileges from a user by email
 * @param email Email of the user to revoke admin privileges from
 * @returns Promise resolving to the result of the operation
 */
export async function revokeAdminPrivileges(email: string) {
  try {
    if (!(await isAdmin())) {
      throw new Error('Only admins can revoke admin privileges');
    }

    const { data, error } = await supabase.rpc('revoke_admin_privileges', { target_email: email });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error revoking admin privileges:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Revoke admin privileges from a user by UUID
 * @param userId UUID of the user to revoke admin privileges from
 * @returns Promise resolving to the result of the operation
 */
export async function revokeAdminPrivilegesByUid(userId: string) {
  try {
    if (!(await isAdmin())) {
      throw new Error('Only admins can revoke admin privileges');
    }

    const { data, error } = await supabase.rpc('revoke_admin_privileges_by_uid', { target_user_id: userId });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error revoking admin privileges:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Get user ID by email
 * @param email Email of the user to look up
 * @returns Promise resolving to user UUID or null
 */
export async function getUserIdByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error looking up user by email:', error?.message || error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error looking up user by email:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get all admin users
 * @returns Promise resolving to array of admin users
 */
export async function getAllAdmins() {
  try {
    if (!(await isAdmin())) {
      throw new Error('Only admins can view admin list');
    }

    const { data, error } = await supabase.rpc('get_all_admins');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting admin list:', error instanceof Error ? error.message : error);
    throw error;
  }
}