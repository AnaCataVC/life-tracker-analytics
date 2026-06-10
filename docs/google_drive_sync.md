# Google Drive Sync Mechanism

While Life Tracker & Analytics is a Local-First application (saving data strictly in the browser's IndexedDB), it incorporates an optional, secure cloud backup mechanism using **Google Drive**.

This allows users to safeguard their data against browser cache clears or device loss, and synchronize their database across multiple devices, all while ensuring the developer never has access to their personal information.

## 1. Authentication (OAuth 2.0 & GIS)

The application uses the modern **Google Identity Services (GIS)** library to handle authentication.

The login flow is triggered in `src/utils/googleDrive.ts` via the `loginGoogleDrive` function. The application requests the following scopes:
- `https://www.googleapis.com/auth/userinfo.profile` (To display the user's name)
- `https://www.googleapis.com/auth/userinfo.email` (To display the user's email)
- `https://www.googleapis.com/auth/drive.file` **(Crucial)**

**The `drive.file` Scope:**
This is a restrictive scope. It only grants the application access to files *that the application itself created*. The app cannot read, modify, or delete any other files in the user's Google Drive. This is a vital privacy feature.

## 2. Backup Data Structure

When a backup is triggered, the application compiles the local IndexedDB data into a single JSON object conforming to the `BackupData` interface:

```typescript
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
```

This ensures that not only the historical logs are saved, but also the user's habit/medication templates and UI preferences.

## 3. The Backup Flow (`backupToDrive`)

1. **Find Existing File**: The app queries Google Drive (`https://www.googleapis.com/drive/v3/files`) to see if a file named `lifetracker_backup.json` already exists.
2. **Prepare Payload**: The JSON data is stringified and placed into a `Blob`.
3. **Multipart Upload**: The app uses a `FormData` object to send both the file metadata (name and mimeType) and the file content simultaneously.
4. **POST or PATCH**:
   - If the file does *not* exist, the app sends a `POST` request to create it.
   - If the file *does* exist, the app sends a `PATCH` request using the file's ID to overwrite the existing backup.

## 4. The Restore Flow (`restoreFromDrive`)

1. **Find File**: The app queries Google Drive to locate `lifetracker_backup.json`.
2. **Download Content**: It fetches the file content using the `?alt=media` query parameter.
3. **Rehydrate Database**: Once downloaded, the application parses the JSON and populates the local `WellbeingDB` (IndexedDB) with the retrieved logs and templates.
