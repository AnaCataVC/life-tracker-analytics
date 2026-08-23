import Dexie, { type EntityTable } from 'dexie';
import { LogEntry } from '../types';

export interface MedicationTemplate {
  id?: number;
  name: string;
  dosage: string;
}

export interface HabitTemplate {
  id?: number;
  name: string;
}

export interface CustomTrackerTemplate {
  id?: number;
  name: string;
  category: 'mood' | 'sleep' | 'focus';
}

export interface PreferenceEntry {
  key: string;
  value: any;
}

const db = new Dexie('WellbeingDB') as Dexie & {
  logs: EntityTable<LogEntry, 'date'>;
  medicationTemplates: EntityTable<MedicationTemplate, 'id'>;
  habitTemplates: EntityTable<HabitTemplate, 'id'>;
  customTrackerTemplates: EntityTable<CustomTrackerTemplate, 'id'>;
  preferences: EntityTable<PreferenceEntry, 'key'>;
};

// Schema declaration
db.version(1).stores({
  logs: 'date, mood, sleepQuality, sleepDuration, concentration',
  medicationTemplates: '++id, name',
  habitTemplates: '++id, name'
});

db.version(2).stores({
  logs: 'date, mood, sleepQuality, sleepDuration, concentration',
  medicationTemplates: '++id, name',
  habitTemplates: '++id, name',
  customTrackerTemplates: '++id, name, category',
  preferences: 'key'
});

export { db };
