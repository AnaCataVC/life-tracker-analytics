import { LogEntry } from "../types";

export interface BackupData {
  version: number;
  logs: LogEntry[];
  templates?: {
    medications: { name: string; dosage: string }[];
    habits: { name: string }[];
  };
  config?: {
    theme: string;
    enabledTrackers: any;
    appLang: string;
  };
}

export const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";

// Define the global google variable injected by the GIS script
declare const google: any;

export function loginGoogleDrive(customClientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = customClientId || GOOGLE_CLIENT_ID;
    if (!clientId) {
      return reject(new Error("No Google Client ID provided."));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile"
        ].join(" "),
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error("Google Login Failed or was cancelled by the user."));
          }
        },
        error_callback: (error: any) => {
          reject(error);
        }
      });
      
      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      console.error("GIS Error:", err);
      reject(err);
    }
  });
}

// Find existing backup file ID
async function findBackupFileId(token: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'lifetracker_backup.json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Failed to search for backup file.");
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

export async function backupToDrive(token: string, data: BackupData): Promise<void> {
  const fileContent = JSON.stringify(data, null, 2);
  const metadata = {
    name: 'lifetracker_backup.json',
    mimeType: 'application/json'
  };

  const fileId = await findBackupFileId(token);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const method = fileId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: form
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload backup: ${errorText}`);
  }
}

export async function restoreFromDrive(token: string): Promise<BackupData> {
  const fileId = await findBackupFileId(token);
  
  if (!fileId) {
    throw new Error("No backup file found on Google Drive.");
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download backup: ${errorText}`);
  }

  const data = await response.json();
  return data;
}
