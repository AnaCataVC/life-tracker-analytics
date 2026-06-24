import RemoteStorage from 'remotestoragejs';
import { BackupData } from '../types';

// Initialize the core RemoteStorage instance
export const rs = new RemoteStorage({ logging: false });

// Request read/write access to a dedicated folder for the app
rs.access.claim('lifetracker', 'rw');

// Get the specific client scope for this folder
export const rsClient = rs.scope('/lifetracker/');

/**
 * Pushes the full backup JSON to the user's remote storage.
 */
export async function pushBackupToRS(backupData: BackupData): Promise<boolean> {
  try {
    const fileContent = JSON.stringify(backupData, null, 2);
    // Storing as a single file inside the claimed folder
    await rsClient.storeFile('application/json', 'lifetracker_backup.json', fileContent);
    return true;
  } catch (error) {
    console.error('RemoteStorage Push Error:', error);
    throw error;
  }
}

/**
 * Pulls the full backup JSON from the user's remote storage.
 */
export async function pullBackupFromRS(): Promise<BackupData | null> {
  try {
    // getFile returns an object { data, mimeType, revision }
    const file = await rsClient.getFile('lifetracker_backup.json') as { data: any, mimeType: string, revision: string };
    if (file && file.data) {
      if (typeof file.data === 'string') {
        return JSON.parse(file.data) as BackupData;
      }
      return file.data as BackupData;
    }
    return null;
  } catch (error) {
    console.error('RemoteStorage Pull Error:', error);
    throw error;
  }
}
