import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  shouldTriggerReminder,
  getReminderSettings,
  saveReminderSettings,
  ReminderSettings,
} from "../src/utils/notifications";
import { getTodayDateString } from "../src/utils/helpers";

describe("Notifications & Daily Reminders Utility", () => {
  let store: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
    });
  });

  beforeEach(() => {
    store = {};
  });

  it("should get default settings if nothing is in localStorage", () => {
    const settings = getReminderSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.time).toBe("21:00");
  });

  it("should save and retrieve custom reminder settings", () => {
    const custom: ReminderSettings = {
      enabled: true,
      time: "20:30",
      lastNotifiedDate: "2026-08-20",
    };
    saveReminderSettings(custom);
    const loaded = getReminderSettings();
    expect(loaded.enabled).toBe(true);
    expect(loaded.time).toBe("20:30");
    expect(loaded.lastNotifiedDate).toBe("2026-08-20");
  });

  describe("shouldTriggerReminder", () => {
    it("should return false if reminders are disabled", () => {
      const settings: ReminderSettings = {
        enabled: false,
        time: "20:00",
      };
      const now = new Date();
      now.setHours(21, 0, 0, 0);
      expect(shouldTriggerReminder(settings, now)).toBe(false);
    });

    it("should return false if already notified today", () => {
      const todayStr = getTodayDateString();
      const settings: ReminderSettings = {
        enabled: true,
        time: "20:00",
        lastNotifiedDate: todayStr,
      };
      const now = new Date();
      now.setHours(21, 0, 0, 0);
      expect(shouldTriggerReminder(settings, now)).toBe(false);
    });

    it("should return false before target time", () => {
      const settings: ReminderSettings = {
        enabled: true,
        time: "21:30",
      };
      const now = new Date();
      now.setHours(20, 15, 0, 0);
      expect(shouldTriggerReminder(settings, now)).toBe(false);
    });

    it("should return true when current time is at or after target time and not yet notified today", () => {
      const settings: ReminderSettings = {
        enabled: true,
        time: "21:00",
        lastNotifiedDate: "2026-08-01", // past date
      };
      const now = new Date();
      now.setHours(21, 5, 0, 0);
      expect(shouldTriggerReminder(settings, now)).toBe(true);
    });
  });
});
