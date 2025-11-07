'use client';

import { useState, useEffect } from 'react';
import UpdateService from './update-service';
import { compareVersions, isValidSemVer } from './version-checker';
import { isAdmin } from '@/lib/adminUtils';

interface UpdateNotificationProps {
  onCheckUpdates?: () => void;
}

export function UpdateNotification({ onCheckUpdates }: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [checking, setChecking] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'applying' | 'completed' | 'error'>('idle');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    checkForUpdates();
    // Check for updates every 30 minutes
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAdminStatus = async () => {
    try {
      const admin = await isAdmin();
      setIsAdminUser(admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdminUser(false);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const versionInfo = await UpdateService.checkForUpdates();
      setUpdateAvailable(versionInfo.updateAvailable);
      setCurrentVersion(versionInfo.currentVersion);
      setLatestVersion(versionInfo.latestVersion);
      
      if (onCheckUpdates) {
        onCheckUpdates();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const handlePerformUpdate = async () => {
    if (!isAdminUser) {
      alert('Only admin users can perform updates');
      return;
    }
    
    try {
      setUpdateStatus('downloading');
      setUpdateProgress(30);
      
      // Get the actual manifest from the update service
      const versionInfo = await UpdateService.checkForUpdates();
      if (!versionInfo.manifest) {
        throw new Error('No update manifest available');
      }
      
      setUpdateProgress(60);
      setUpdateStatus('applying');
      
      // Perform the actual update
      const success = await UpdateService.performUpdate(versionInfo.manifest);
      
      if (success) {
        setUpdateProgress(100);
        setUpdateStatus('completed');
        setUpdateAvailable(false);
        
        // For web applications, we typically need to refresh to get the new version
        setTimeout(() => {
          alert('Update prepared successfully! The page will refresh to apply changes.');
          window.location.reload();
        }, 1500);
      } else {
        setUpdateStatus('error');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateStatus('error');
    }
  };

  // Only show notification if user is admin and update is available
  if (!updateAvailable || !isAdminUser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Update Available</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Version {latestVersion} is available (current: {currentVersion})
            </p>
            
            {updateStatus === 'idle' && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handlePerformUpdate}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setUpdateAvailable(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Later
                </button>
              </div>
            )}
            
            {updateStatus !== 'idle' && updateStatus !== 'completed' && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {updateStatus === 'downloading' && 'Preparing update...'}
                  {updateStatus === 'applying' && 'Applying update...'}
                  {updateStatus === 'error' && 'Update failed. Please try again.'}
                </p>
              </div>
            )}
            
            {updateStatus === 'completed' && (
              <p className="text-sm text-green-600 dark:text-green-400">Update ready! Refreshing page...</p>
            )}
          </div>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

interface UpdatePanelProps {
  onUpdateComplete?: () => void;
}

export function UpdatePanel({ onUpdateComplete }: UpdatePanelProps) {
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [allReleases, setAllReleases] = useState<any[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);

  useEffect(() => {
    loadAdminStatus();
    loadVersionInfo();
    loadAllReleases();
  }, []);

  const loadAdminStatus = async () => {
    try {
      const admin = await isAdmin();
      setIsAdminUser(admin);
      if (admin) {
        setShowAdminControls(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadVersionInfo = async () => {
    try {
      setLoading(true);
      const info = await UpdateService.checkForUpdates();
      setVersionInfo(info);
    } catch (error) {
      console.error('Error loading version info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllReleases = async () => {
    try {
      const releases = await UpdateService.getAllReleases();
      setAllReleases(releases);
    } catch (error) {
      console.error('Error loading all releases:', error);
    }
  };

  const handleUpdate = async () => {
    if (!isAdminUser) {
      alert('Only admin users can perform updates');
      return;
    }
    
    if (!versionInfo?.manifest) return;
    
    try {
      setUpdateStatus('processing');
      setProgress(20);
      
      setProgress(50);
      // Perform the actual update using the manifest from versionInfo
      const success = await UpdateService.performUpdate(versionInfo.manifest);
      
      if (success) {
        setProgress(100);
        setUpdateStatus('success');
        if (onUpdateComplete) onUpdateComplete();
        
        // Reload after delay to let user see success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUpdateStatus('error');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If user is not admin, only show version info without update functionality
  if (!isAdminUser) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Updates</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Version</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{versionInfo?.currentVersion || 'Unknown'}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest Version</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{versionInfo?.latestVersion || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Access Restricted</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Update functionality is only available to admin users.
            </p>
          </div>
          
          {/* Recent releases section */}
          {allReleases.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recent Releases</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allReleases.slice(0, 5).map((release: any) => (
                  <div key={release.id} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {release.tag_name.startsWith('v') ? release.tag_name.substring(1) : release.tag_name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(release.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    {release.name && release.name !== release.tag_name && (
                      <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs">{release.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Update Information</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Updates are fetched from: <span className="font-mono">https://github.com/minggudevv/finance-manager-v3</span></p>
              <p>This application follows semantic versioning (MAJOR.MINOR.PATCH)</p>
              <p>Database schema is managed separately in the database_stable directory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Updates</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Version</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{versionInfo?.currentVersion || 'Unknown'}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest Version</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{versionInfo?.latestVersion || 'Unknown'}</p>
          </div>
        </div>
        
        {versionInfo?.updateAvailable ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Update Available</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Version {versionInfo?.latestVersion} is ready to install
            </p>
            
            {versionInfo?.manifest?.description && (
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Release Notes:</p>
                <p>{versionInfo.manifest.description}</p>
              </div>
            )}
            
            {updateStatus === 'idle' && (
              <button
                onClick={handleUpdate}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Install Update
              </button>
            )}
            
            {updateStatus === 'processing' && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Installing update from GitHub...</p>
              </div>
            )}
            
            {updateStatus === 'success' && (
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                Update installed successfully! Page will refresh...
              </div>
            )}
            
            {updateStatus === 'error' && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                Update failed. Please try again.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200">Up to Date</h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your application is running the latest version
            </p>
          </div>
        )}
        
        {/* Recent releases section */}
        {allReleases.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recent Releases</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allReleases.slice(0, 5).map((release: any) => (
                <div key={release.id} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {release.tag_name.startsWith('v') ? release.tag_name.substring(1) : release.tag_name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(release.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  {release.name && release.name !== release.tag_name && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs">{release.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Update Information</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Updates are fetched from: <span className="font-mono">https://github.com/minggudevv/finance-manager-v3</span></p>
            <p>This application follows semantic versioning (MAJOR.MINOR.PATCH)</p>
            <p>Database schema is managed separately in the database_stable directory</p>
          </div>
        </div>
      </div>
    </div>
  );
}