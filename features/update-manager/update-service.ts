// Application Update Service
// Handles application updates, version management, and update validation

import { getCurrentUser } from '@/lib/supabaseClient';
import { isAdmin } from '@/lib/adminUtils';

interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string; // This is the version
  name: string; // Release name
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Array<{
    url: string;
    id: number;
    name: string;
    content_type: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
  }>;
  body: string; // Release notes/description
}

interface UpdateManifest {
  version: string;
  releaseDate: string;
  description: string;
  downloadUrl: string;
  checksum: string;
  required: boolean;
  breakingChanges: boolean;
}

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  manifest?: UpdateManifest;
}

class UpdateService {
  private static instance: UpdateService;
  private currentVersion: string = process.env.npm_package_version || '1.0.0';
  private readonly githubRepo: string = 'minggudevv/finance-manager-v3';
  
  private constructor() {}
  
  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Check for available updates from GitHub
   * @returns Version information including whether update is available
   */
  async checkForUpdates(): Promise<VersionInfo> {
    try {
      const release = await this.fetchLatestRelease();
      if (!release) {
        throw new Error('No releases found on GitHub');
      }
      
      const manifest = this.convertGitHubReleaseToManifest(release);
      const updateAvailable = this.compareVersions(manifest.version, this.currentVersion) > 0;
      
      return {
        currentVersion: this.currentVersion,
        latestVersion: manifest.version,
        updateAvailable,
        manifest: updateAvailable ? manifest : undefined
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        updateAvailable: false
      };
    }
  }

  /**
   * Fetch latest release from GitHub
   * @returns GitHub release data or null if no release found
   */
  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.githubRepo}/releases/latest`);
      
      if (!response.ok) {
        // If there's no latest release, get all releases and pick the first one
        if (response.status === 404) {
          const allReleasesResponse = await fetch(`https://api.github.com/repos/${this.githubRepo}/releases`);
          if (!allReleasesResponse.ok) {
            throw new Error(`GitHub API error: ${allReleasesResponse.status}`);
          }
          
          const allReleases: GitHubRelease[] = await allReleasesResponse.json();
          if (allReleases.length > 0) {
            return allReleases[0]; // Return the most recent release
          }
        }
        return null;
      }
      
      const release: GitHubRelease = await response.json();
      return release;
    } catch (error) {
      console.error('Error fetching GitHub release:', error);
      return null;
    }
  }

  /**
   * Convert GitHub release to UpdateManifest
   * @param release GitHub release object
   * @returns Update manifest
   */
  private convertGitHubReleaseToManifest(release: GitHubRelease): UpdateManifest {
    // Use the first asset as the download URL, or fall back to release URL
    const downloadUrl = release.assets.length > 0 
      ? release.assets[0].browser_download_url 
      : release.html_url;
    
    return {
      version: release.tag_name.startsWith('v') ? release.tag_name.substring(1) : release.tag_name,
      releaseDate: release.published_at,
      description: release.body || `Release ${release.tag_name}`,
      downloadUrl,
      checksum: '', // Checksum would be added in release notes or asset metadata
      required: false, // In a real implementation, this could be determined from release metadata
      breakingChanges: false // In a real implementation, this could be determined from release notes
    };
  }

  /**
   * Perform application update
   * @param manifest Update manifest to apply
   * @returns Success status
   */
  async performUpdate(manifest: UpdateManifest): Promise<boolean> {
    try {
      // Verify user has admin privileges
      if (!(await isAdmin())) {
        throw new Error('Only admin users can perform updates');
      }

      console.log(`Starting update to version ${manifest.version}`);
      
      await this.validateUpdate(manifest);
      await this.downloadUpdate(manifest);
      
      // Since this is a web application, the update will be applied when the page refreshes
      // This would need to be handled differently in a real-world scenario
      console.log(`Update to version ${manifest.version} prepared. Page will need to be refreshed.`);
      return true;
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    }
  }

  /**
   * Validate update manifest
   * @param manifest Update manifest to validate
   */
  private async validateUpdate(manifest: UpdateManifest): Promise<void> {
    // Check if version is newer than current
    if (this.compareVersions(manifest.version, this.currentVersion) <= 0) {
      throw new Error('Update version is not newer than current version');
    }
    
    // Additional validation would happen here
    console.log(`Update manifest validated for version ${manifest.version}`);
  }

  /**
   * Download update package from GitHub
   * @param manifest Update manifest containing download info
   */
  private async downloadUpdate(manifest: UpdateManifest): Promise<void> {
    console.log(`Checking update availability for version ${manifest.version} from ${manifest.downloadUrl}`);
    
    // In a web-based app, the actual update happens through the deployment platform (Vercel, Netlify, etc.)
    // The client doesn't download and install files directly
    // We'll simulate the check by trying to access the download URL
    try {
      const response = await fetch(manifest.downloadUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Download URL not accessible: ${response.status}`);
      }
      console.log(`Update package verified for version ${manifest.version}`);
    } catch (error) {
      console.error(`Error accessing update package:`, error);
      throw error;
    }
  }

  /**
   * Compare two version strings
   * @param v1 First version
   * @param v2 Second version
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Get current application version
   * @returns Current application version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }
  
  /**
   * Get all releases from GitHub
   * @returns Array of GitHub releases
   */
  async getAllReleases(): Promise<GitHubRelease[]> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.githubRepo}/releases`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const releases: GitHubRelease[] = await response.json();
      return releases;
    } catch (error) {
      console.error('Error fetching all GitHub releases:', error);
      return [];
    }
  }
}

export default UpdateService.getInstance();