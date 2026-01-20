/**
 * Google Drive Integration for Automatic Backups
 * 
 * This module handles:
 * - OAuth2 authentication with Google Drive
 * - Uploading backup files
 * - Listing previous backups
 * - Downloading/restoring backups
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInited = false;
let gisInited = false;
let tokenClient: any;

/**
 * Initialize Google API and Google Identity Services
 */
export async function initializeGoogleDrive(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load gapi
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        maybeResolve();
      });
    };
    document.body.appendChild(gapiScript);

    // Load gis
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
      maybeResolve();
    };
    document.body.appendChild(gisScript);

    function maybeResolve() {
      if (gapiInited && gisInited) {
        resolve();
      }
    }

    setTimeout(() => reject(new Error('Google Drive initialization timeout')), 10000);
  });
}

/**
 * Request authorization from user to access Google Drive
 */
export function authorizeGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        } else {
          // Store token in localStorage
          localStorage.setItem('google_drive_token', resp.access_token);
          resolve(resp.access_token);
        }
      };

      if ((window as any).gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Check if user is already authorized
 */
export function isAuthorized(): boolean {
  const token = localStorage.getItem('google_drive_token');
  if (!token) return false;
  
  // Set token if available
  (window as any).gapi.client.setToken({ access_token: token });
  return true;
}

/**
 * Revoke Google Drive access
 */
export function revokeGoogleDrive(): void {
  const token = localStorage.getItem('google_drive_token');
  if (token) {
    (window as any).google.accounts.oauth2.revoke(token);
    localStorage.removeItem('google_drive_token');
  }
  (window as any).gapi.client.setToken(null);
}

/**
 * Upload backup file to Google Drive
 */
export async function uploadBackupToDrive(data: any): Promise<string> {
  const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
  const fileContent = JSON.stringify(data, null, 2);
  const file = new Blob([fileContent], { type: 'application/json' });

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: ['appDataFolder'], // Store in app-specific folder
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const token = localStorage.getItem('google_drive_token');
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload backup to Google Drive');
  }

  const result = await response.json();
  return result.id;
}

/**
 * List all backup files from Google Drive
 */
export async function listBackupsFromDrive(): Promise<Array<{ id: string; name: string; createdTime: string }>> {
  const response = await (window as any).gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name, createdTime)',
    orderBy: 'createdTime desc',
  });

  return response.result.files || [];
}

/**
 * Download backup file from Google Drive
 */
export async function downloadBackupFromDrive(fileId: string): Promise<any> {
  const token = localStorage.getItem('google_drive_token');
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download backup from Google Drive');
  }

  return await response.json();
}

/**
 * Delete backup file from Google Drive
 */
export async function deleteBackupFromDrive(fileId: string): Promise<void> {
  await (window as any).gapi.client.drive.files.delete({
    fileId: fileId,
  });
}
