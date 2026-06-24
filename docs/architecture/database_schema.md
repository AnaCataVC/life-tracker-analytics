# Local Database Architecture (Dexie.js)

Life Tracker & Analytics is built entirely around a **Local-First** paradigm. This means the application does not rely on a centralized backend server (like Node.js, Python, or Ruby) to store or process your data. Instead, it leverages **IndexedDB**, a low-level API for client-side storage of significant amounts of structured data, built directly into modern web browsers.

To make working with IndexedDB simpler, more robust, and fully typed, the application uses **Dexie.js**, a minimalist wrapper for IndexedDB.

## Why Local-First?

1. **Extreme Privacy**: Your personal health data, moods, and habits never touch a third-party corporate server. You own your data.
2. **Offline Capable**: Because the database lives in your browser, the app loads instantly and functions perfectly without an internet connection.
3. **Zero Latency**: Read and write operations are practically instantaneous since there are no network requests involved.

## Database Schema (`WellbeingDB`)

The database is initialized in `src/utils/db.ts` with the name `WellbeingDB`. It currently uses `version(1)` and consists of three primary tables (object stores):

### 1. `logs`
This is the core table where all daily well-being records are stored.
- **Primary Key**: `date` (stored as an ISO string, e.g., `"YYYY-MM-DD"`). This ensures only one log exists per day.
- **Indexed Fields**: `mood`, `sleepQuality`, `sleepDuration`, `concentration`. These indices allow for fast queries when the analytics engine aggregates data.
- **Structure (Typescript `LogEntry`)**:
  - `date`: string
  - `mood`: number (1-10)
  - `moodTags`: string[] (e.g., `["happy", "calm"]`)
  - `sleepQuality`: number (1-10)
  - `bedtime`: string (e.g., `"23:00"`)
  - `waketime`: string (e.g., `"07:30"`)
  - `sleepDuration`: number (calculated hours)
  - `tookNap`: boolean (optional)
  - `napDuration`: number (optional)
  - `concentration`: number (1-10)
  - `tasks`: Array of `{ id, name, completed }`
  - `medications`: Array of `{ id, name, dosage, taken }`

### 2. `medicationTemplates`
Stores the user's recurring medications so they can be easily added to a new daily log.
- **Primary Key**: `id` (Auto-incremented `++id`).
- **Indexed Fields**: `name`.
- **Structure**:
  - `id`: number
  - `name`: string
  - `dosage`: string

### 3. `habitTemplates`
Stores the user's recurring daily habits or tasks.
- **Primary Key**: `id` (Auto-incremented `++id`).
- **Indexed Fields**: `name`.
- **Structure**:
  - `id`: number
  - `name`: string

## Interacting with the Database

The application uses standard Dexie promises to interact with the database. For example, retrieving the entire history for the analytics engine is as simple as:

```typescript
import { db } from './utils/db';
const history = await db.logs.toArray();
```

Saving a daily log uses the `put` method, which inserts a new record or overwrites an existing one with the same `date` primary key:

```typescript
await db.logs.put(currentLog);
```
