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

const db = new Dexie('WellbeingDB') as Dexie & {
  logs: EntityTable<LogEntry, 'date'>;
  medicationTemplates: EntityTable<MedicationTemplate, 'id'>;
  habitTemplates: EntityTable<HabitTemplate, 'id'>;
};

// Schema declaration
db.version(1).stores({
  logs: 'date, mood, sleepQuality, sleepDuration, concentration', // 'date' is primary key
  medicationTemplates: '++id, name', // 'id' is primary key, 'name' is indexed
  habitTemplates: '++id, name'
});

export { db };
