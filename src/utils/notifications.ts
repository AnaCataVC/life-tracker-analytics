import { getTodayDateString } from "./helpers";

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM (24h format)
  lastNotifiedDate?: string; // YYYY-MM-DD
}

const REMINDER_STORAGE_KEY = "wellbeing_reminder_settings";

/**
 * Checks if Notification API is available in the current browser environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Gets current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Requests permission from user to show web notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return false;
  }
}

/**
 * Loads reminder settings from local storage with defaults.
 */
export function getReminderSettings(): ReminderSettings {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (err) {
    console.error("Error reading reminder settings:", err);
  }
  return {
    enabled: false,
    time: "21:00",
  };
}

/**
 * Saves reminder settings to local storage.
 */
export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error("Error saving reminder settings:", err);
  }
}

/**
 * Checks if a reminder should be triggered right now based on time and last date.
 */
export function shouldTriggerReminder(
  settings: ReminderSettings,
  currentDate: Date = new Date()
): boolean {
  if (!settings.enabled || !settings.time) return false;

  const todayStr = getTodayDateString();
  if (settings.lastNotifiedDate === todayStr) {
    return false; // Already notified today
  }

  const [targetHours, targetMins] = settings.time.split(":").map(Number);
  const currentHours = currentDate.getHours();
  const currentMins = currentDate.getMinutes();

  const targetMinutes = targetHours * 60 + targetMins;
  const currentMinutes = currentHours * 60 + currentMins;

  // Trigger if current time is within or past target time today
  return currentMinutes >= targetMinutes;
}

/**
 * Dispatches a native browser notification if permission is granted.
 */
export function triggerNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    new Notification(title, {
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      ...options,
    });
    return true;
  } catch (err) {
    console.error("Error triggering native notification:", err);
    return false;
  }
}
