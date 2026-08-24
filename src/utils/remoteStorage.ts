import RemoteStorage from 'remotestoragejs';
import { BackupData, LogEntry } from '../types';

// Initialize the core RemoteStorage instance
export const rs = new RemoteStorage({ logging: false });

// Request read/write access to a dedicated folder for the app
rs.access.claim('lifetracker', 'rw');

// Get the specific client scope for this folder
export const rsClient = rs.scope('/lifetracker/');

/**
 * Pure non-destructive log merge utility.
 * Merges local and remote entries by 'date' as primary key without losing disjoint days.
 * Returns sorted entries (newest first).
 */
export function mergeLogs(localLogs: LogEntry[] = [], remoteLogs: LogEntry[] = []): LogEntry[] {
  const mergedMap = new Map<string, LogEntry>();

  // Add remote logs first
  for (const remoteEntry of remoteLogs) {
    if (remoteEntry && remoteEntry.date) {
      mergedMap.set(remoteEntry.date, { ...remoteEntry });
    }
  }

  // Merge or overwrite with local logs
  for (const localEntry of localLogs) {
    if (!localEntry || !localEntry.date) continue;

    const existing = mergedMap.get(localEntry.date);
    if (!existing) {
      mergedMap.set(localEntry.date, { ...localEntry });
    } else {
      // Intelligent field-level reconciliation: combine tasks and medications if disjoint
      const mergedMedications = [...(localEntry.medications || [])];
      for (const rMed of existing.medications || []) {
        if (!mergedMedications.some(m => m.name.toLowerCase() === rMed.name.toLowerCase())) {
          mergedMedications.push(rMed);
        }
      }

      const mergedTasks = [...(localEntry.tasks || [])];
      for (const rTask of existing.tasks || []) {
        if (!mergedTasks.some(t => t.name.toLowerCase() === rTask.name.toLowerCase())) {
          mergedTasks.push(rTask);
        }
      }

      const mergedTags = Array.from(new Set([...(localEntry.moodTags || []), ...(existing.moodTags || [])]));

      mergedMap.set(localEntry.date, {
        ...existing,
        ...localEntry,
        medications: mergedMedications,
        tasks: mergedTasks,
        moodTags: mergedTags,
      });
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Pushes a single day log entry to remote storage (granular sync).
 */
export async function pushLogToRS(entry: LogEntry): Promise<boolean> {
  if (!entry || !entry.date) return false;
  try {
    const fileContent = JSON.stringify(entry, null, 2);
    await rsClient.storeFile('application/json', `logs/${entry.date}.json`, fileContent);
    return true;
  } catch (error) {
    console.error(`RemoteStorage Granular Push Error for ${entry.date}:`, error);
    throw error;
  }
}

/**
 * Pulls all granular day logs from remote storage.
 */
export async function pullAllLogsFromRS(): Promise<LogEntry[]> {
  try {
    const listing = await rsClient.getListing('logs/') as Record<string, unknown> | null;
    if (!listing) return [];

    const fileKeys = Object.keys(listing).filter((key) => key.endsWith('.json'));
    const logs: LogEntry[] = [];

    for (const key of fileKeys) {
      try {
        const file = await rsClient.getFile(`logs/${key}`) as { data: any } | null;
        if (file && file.data) {
          const entry = typeof file.data === 'string' ? JSON.parse(file.data) : file.data;
          if (entry && entry.date) {
            logs.push(entry);
          }
        }
      } catch (err) {
        console.warn(`Could not parse remote log file: logs/${key}`, err);
      }
    }

    return logs;
  } catch (error) {
    console.error('RemoteStorage Granular Pull Error:', error);
    return [];
  }
}

/**
 * Pushes the full backup JSON to the user's remote storage (monolithic fallback).
 */
export async function pushBackupToRS(backupData: BackupData): Promise<boolean> {
  try {
    const fileContent = JSON.stringify(backupData, null, 2);
    await rsClient.storeFile('application/json', 'lifetracker_backup.json', fileContent);
    return true;
  } catch (error) {
    console.error('RemoteStorage Push Error:', error);
    throw error;
  }
}

/**
 * Pulls the full backup JSON from the user's remote storage (monolithic fallback).
 */
export async function pullBackupFromRS(): Promise<BackupData | null> {
  try {
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

/**
 * Full two-way granular synchronization engine.
 * Merges local and remote entries, persists new entries remotely and returns the reconciled dataset.
 */
export async function syncGranularData(
  localLogs: LogEntry[],
  fullBackupData: BackupData
): Promise<{ mergedLogs: LogEntry[]; remoteBackup: BackupData | null }> {
  try {
    // 1. Pull remote granular logs
    const remoteLogs = await pullAllLogsFromRS();
    
    // 2. Also check if there is a monolithic backup if no granular logs yet
    let fallbackRemoteLogs: LogEntry[] = [];
    let remoteBackup: BackupData | null = null;
    if (remoteLogs.length === 0) {
      remoteBackup = await pullBackupFromRS();
      if (remoteBackup && Array.isArray(remoteBackup.logs)) {
        fallbackRemoteLogs = remoteBackup.logs;
      }
    }

    // 3. Perform smart merge
    const mergedLogs = mergeLogs(localLogs, remoteLogs.length > 0 ? remoteLogs : fallbackRemoteLogs);

    // 4. Push any missing granular files to remote storage
    for (const log of mergedLogs) {
      await pushLogToRS(log);
    }

    // 5. Update monolithic backup as well for consolidated recovery
    await pushBackupToRS({
      ...fullBackupData,
      logs: mergedLogs,
    });

    return { mergedLogs, remoteBackup };
  } catch (err) {
    console.error("Granular sync error:", err);
    throw err;
  }
}
