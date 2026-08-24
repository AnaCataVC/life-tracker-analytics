import { describe, it, expect } from "vitest";
import {
  calculateSleepDuration,
  getTotalSleep,
  getTodayDateString,
  validateBackupData,
} from "../src/utils/helpers";
import { LogEntry } from "../src/types";

describe("Helpers Utilities", () => {
  describe("calculateSleepDuration", () => {
    it("should return 0 if bedtime or waketime is missing", () => {
      expect(calculateSleepDuration("", "07:00")).toBe(0);
      expect(calculateSleepDuration("23:00", "")).toBe(0);
      expect(calculateSleepDuration("", "")).toBe(0);
    });

    it("should calculate duration on the same day correctly", () => {
      expect(calculateSleepDuration("01:00", "08:30")).toBe(7.5);
      expect(calculateSleepDuration("00:00", "08:00")).toBe(8.0);
    });

    it("should calculate overnight sleep duration crossing midnight", () => {
      expect(calculateSleepDuration("23:00", "07:00")).toBe(8.0);
      expect(calculateSleepDuration("22:30", "06:30")).toBe(8.0);
      expect(calculateSleepDuration("23:45", "07:15")).toBe(7.5);
    });
  });

  describe("getTotalSleep", () => {
    const baseEntry: LogEntry = {
      date: "2026-08-20",
      mood: 8,
      sleepQuality: 8,
      sleepDuration: 7.5,
      bedtime: "23:00",
      waketime: "06:30",
      concentration: 8,
      moodTags: [],
      medications: [],
      tasks: [],
    };

    it("should return only sleepDuration if addNapToTotalSleep is disabled or tookNap is false", () => {
      expect(getTotalSleep(baseEntry, { addNapToTotalSleep: false })).toBe(7.5);
      expect(getTotalSleep({ ...baseEntry, tookNap: false, napDuration: 1.5 }, { addNapToTotalSleep: true })).toBe(7.5);
    });

    it("should sum napDuration if addNapToTotalSleep is true and tookNap is true", () => {
      const entryWithNap: LogEntry = {
        ...baseEntry,
        tookNap: true,
        napDuration: 1.5,
      };
      expect(getTotalSleep(entryWithNap, { addNapToTotalSleep: true })).toBe(9.0);
    });
  });

  describe("getTodayDateString", () => {
    it("should return a string in YYYY-MM-DD format", () => {
      const date = getTodayDateString();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("validateBackupData", () => {
    it("should reject null, non-objects or invalid payloads", () => {
      expect(validateBackupData(null).isValid).toBe(false);
      expect(validateBackupData("invalid json string").isValid).toBe(false);
      expect(validateBackupData({}).isValid).toBe(false);
      expect(validateBackupData({ logs: "not-an-array" }).isValid).toBe(false);
    });

    it("should reject entries with invalid date format", () => {
      const invalid = {
        logs: [
          { date: "20-08-2026", mood: 7 },
        ],
      };
      const result = validateBackupData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid log entry");
    });

    it("should validate a proper BackupData object", () => {
      const valid = {
        version: 2,
        logs: [
          {
            date: "2026-08-20",
            mood: 8,
            sleepQuality: 8,
            sleepDuration: 7.5,
            bedtime: "23:00",
            waketime: "06:30",
            concentration: 8,
            medications: [],
            tasks: [],
            notes: "",
          },
        ],
        templates: {
          medications: [{ name: "Vitamin D", dosage: "2000 IU" }],
          habits: [{ name: "Morning Walk" }],
        },
        config: {
          theme: "dark",
          appLang: "en",
          enabledTrackers: {
            mood: true,
            sleep: true,
            focus: true,
            medications: true,
            tasks: true,
          },
        },
      };

      const result = validateBackupData(valid);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
