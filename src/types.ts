import type { ConfidenceLevel } from "./utils/heuristics/statistics";

export interface TaskItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  taken: boolean;
}

export interface LogEntry {
  date: string; // ISO date string YYYY-MM-DD
  mood: number; // 1-10

  moodTags: string[]; // ['happy', 'anxious', 'tired', 'calm', etc.]
  sleepQuality: number; // 1-10
  bedtime: string; // "HH:MM" e.g. "23:00"
  waketime: string; // "HH:MM" e.g. "07:30"
  sleepDuration: number; // calculated hours, e.g. 8.5
  tookNap?: boolean;
  napDuration?: number; // hours
  customTrackers?: { id: string; name: string; value: boolean; category: TrackerCategory }[];
  concentration: number; // 1-10
  tasks: TaskItem[];
  medications: MedicationItem[];
}

export interface Correlation {
  categoryA: string;
  categoryB: string;
  direction: "positive" | "negative" | "neutral" | string;
  description: string;
}

export interface ActionableInsight {
  habit: string;
  impact: string;
  targetArea: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
}

export interface IndividualFactorImpact {
  name: string;
  type: "habit" | "medication" | "custom_tracker";
  dosage?: string;
  daysPresent: number;
  daysCompleted: number; // or daysTaken
  avgMoodWith: number;
  avgMoodWithout: number;
  avgFocusWith: number;
  avgFocusWithout: number;
  avgSleepDurWith?: number;
  avgSleepDurWithout?: number;
  avgSleepQualWith?: number;
  avgSleepQualWithout?: number;
  moodDifference: number; // avgMoodWith - avgMoodWithout
  focusDifference: number; // avgFocusWith - avgFocusWithout
  sleepDurDifference?: number;
  sleepQualDifference?: number;
  associatedTags?: string[];
  /** Statistical confidence tier for this insight. "insufficient" means not enough data to compare. */
  confidence: ConfidenceLevel;
}

export interface WellBeingInsights {
  overallSummary: string;
  wellbeingScore: number;
  correlations: Correlation[];
  actionableInsights: ActionableInsight[];
  positives: string[];
  warnings: string[];
  individualImpacts?: IndividualFactorImpact[];
}

export interface UserMetadata {
  name: string;
  age?: number;
  mainGoals?: string[];
  notes?: string;
}

export interface HeatmapData {
  date: string;
  count: number;
}

export type TrackerCategory = "mood" | "sleep" | "focus";

export interface EnabledTrackers {
  mood: boolean;
  sleep: boolean;
  focus: boolean;
  medications: boolean;
  tasks: boolean;
  customTrackers?: boolean;
  addNapToTotalSleep?: boolean;
}

export interface BackupData {
  version: number;
  logs: LogEntry[];
  templates?: {
    medications: { name: string; dosage: string }[];
    habits: { name: string }[];
    customTrackers?: { name: string; category: TrackerCategory }[];
  };
  config?: {
    theme: string;
    enabledTrackers: any;
    appLang: string;
  };
}
