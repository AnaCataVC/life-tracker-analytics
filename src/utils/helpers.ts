import { LogEntry, TaskItem, MedicationItem } from "../types";

/**
 * Calculates the sleep duration in hours given a bedtime and a waketime (HH:MM format)
 */
export function calculateSleepDuration(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0;

  const [bedHours, bedMins] = bedtime.split(":").map(Number);
  const [wakeHours, wakeMins] = waketime.split(":").map(Number);

  let duration = (wakeHours * 60 + wakeMins) - (bedHours * 60 + bedMins);

  // If bedtime is later than waketime (e.g., sleep at 23:00, wake at 07:00 next day)
  if (duration < 0) {
    duration += 24 * 60; // add a full day in minutes
  }

  return parseFloat((duration / 60).toFixed(1));
}

/**
 * Calculates the total sleep including nap if the user has enabled it and taken a nap
 */
export function getTotalSleep(entry: LogEntry, enabledTrackers?: { addNapToTotalSleep?: boolean }): number {
  let total = entry.sleepDuration || 0;
  if (enabledTrackers?.addNapToTotalSleep && entry.tookNap && entry.napDuration) {
    total += entry.napDuration;
  }
  return parseFloat(total.toFixed(1));
}

/**
 * Returns formatted date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the app is running as an installed PWA or in browser
 */
export const isRunningAsPWA = (): boolean => {
  if (typeof window === "undefined") return false;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = ("standalone" in window.navigator) && (window.navigator as any).standalone;
  return isStandalone || !!isIOSStandalone;
};
