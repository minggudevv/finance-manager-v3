'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Users, AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react';
import { isAdmin } from '@/lib/adminUtils';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { initializeAppSettings } from '@/lib/dbInitUtils';

interface SiteSettings {
  allow_registration: boolean;
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    allow_registration: true,
    site_name: 'Finance Manager',
    site_description: 'Aplikasi pengelola keuangan',
    maintenance_mode: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  const checkAdminAndLoadSettings = async () => {
    try {
      const admin = await isAdmin();
      setIsAdminUser(admin);
      
      if (!admin) {
        router.push('/dashboard');
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      await loadSettings();
    } catch (error) {
      console.error('Error checking admin status:', error instanceof Error ? error.message : error);
      toast.error('Error checking admin status');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Try to load settings from the database
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      // Handle different types of errors
      if (error) {
        // Log the full error for debugging
        console.log('Full error object:', error);
        
        // PGRST116 means no rows found - this is OK for first-time setup
        if (error.code === 'PGRST116') {
          console.log('No settings found, using defaults');
          // Use default settings for first-time setup
          setSettings({
            allow_registration: true,
            site_name: 'Finance Manager',
            site_description: 'Aplikasi pengelola keuangan',
            maintenance_mode: false
          });
        } 
        // 42P01 means table doesn't exist
        else if (error.code === '42P01') {
          console.warn('Settings table does not exist yet. Using defaults.');
          // Use default settings when table doesn't exist
          setSettings({
            allow_registration: true,
            site_name: 'Finance Manager',
            site_description: 'Aplikasi pengelola keuangan',
            maintenance_mode: false
          });
        }
        // Other errors - be more lenient and still use defaults
        else {
          console.warn('Non-critical error loading settings, using defaults:', error.message || error);
          // Still use defaults instead of showing error to user
          setSettings({
            allow_registration: true,
            site_name: 'Finance Manager',
            site_description: 'Aplikasi pengelola keuangan',
            maintenance_mode: false
          });
        }
      } 
      // Successfully loaded data
      else if (data) {
        setSettings({
          allow_registration: data.allow_registration ?? true,
          site_name: data.site_name ?? 'Finance Manager',
          site_description: data.site_description ?? 'Aplikasi pengelola keuangan',
          maintenance_mode: data.maintenance_mode ?? false
        });
      }
      // No data but no error (shouldn't happen with single())
      else {
        console.log('No data and no error, using defaults');
        setSettings({
          allow_registration: true,
          site_name: 'Finance Manager',
          site_description: 'Aplikasi pengelola keuangan',
          maintenance_mode: false
        });
      }
    } catch (error) {
      console.warn('Unexpected error loading settings, using defaults:', error);
      // Use defaults as fallback instead of showing error to user
      setSettings({
        allow_registration: true,
        site_name: 'Finance Manager',
        site_description: 'Aplikasi pengelola keuangan',
        maintenance_mode: false
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update or insert the app_settings table
      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          id: 1,  // Single row table with id = 1
          allow_registration: settings.allow_registration,
          site_name: settings.site_name,
          site_description: settings.site_description,
          maintenance_mode: settings.maintenance_mode,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });

      if (error) throw error;

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error instanceof Error ? error.message : error);
      // Try to create the table and insert if it doesn't exist
      toast.error('Error saving settings. Please make sure the database is properly initialized.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Checking admin status...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="ml-3 text-3xl font-bold text-gray-900 dark:text-white">Site Settings</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your site configuration and settings</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General Settings</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                name="site_name"
                value={settings.site_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The name of your application</p>
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Description
              </label>
              <textarea
                name="site_description"
                value={settings.site_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Brief description of your application</p>
            </div>

            {/* Registration Toggle */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow_registration"
                  name="allow_registration"
                  type="checkbox"
                  checked={settings.allow_registration}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="allow_registration" className="font-medium text-gray-700 dark:text-gray-300">
                  Allow New Registrations
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  {settings.allow_registration 
                    ? 'New users can register for accounts' 
                    : 'Registration is currently disabled'}
                </p>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="maintenance_mode"
                  name="maintenance_mode"
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="maintenance_mode" className="font-medium text-gray-700 dark:text-gray-300">
                  Maintenance Mode
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  {settings.maintenance_mode 
                    ? 'Only admins can access the application' 
                    : 'Application is running normally'}
                </p>
              </div>
            </div>
          </div>

          {/* Update Management Section */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Application Updates</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Update Management</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>Manage application updates and version control</p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-700/50"
                    >
                      Go to Updates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <span>← Back to Dashboard</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}