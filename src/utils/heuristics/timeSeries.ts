import { LogEntry, EnabledTrackers, RollingTrend, LaggedImpact } from "../../types";
import { getTotalSleep } from "../helpers";
import {
  mean,
  stdDev,
  effectSize,
  confidenceLevel,
  calculateBaselineDeviation,
  rollingAverage,
  MIN_SAMPLE_SIZE,
} from "./statistics";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a YYYY-MM-DD date string into UTC milliseconds.
 * Using UTC avoids local timezone offsets and Daylight Saving Time (DST) shifts.
 */
export function parseDateUTC(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Formats a UTC timestamp back into a YYYY-MM-DD string.
 */
export function formatUTCDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes exact calendar day difference between two YYYY-MM-DD date strings.
 * Returns dateB - dateA in days.
 */
export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
  const msA = parseDateUTC(dateStrA);
  const msB = parseDateUTC(dateStrB);
  if (msA === 0 || msB === 0) return 0;
  return Math.round((msB - msA) / MS_PER_DAY);
}

/**
 * Chronologically sorts log entries by date and de-duplicates any duplicate dates (keeping latest).
 */
export function sortAndDeduplicateLogs(history: LogEntry[]): LogEntry[] {
  const map = new Map<string, LogEntry>();
  for (const entry of history) {
    if (entry.date && entry.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      map.set(entry.date, entry);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => parseDateUTC(a.date) - parseDateUTC(b.date)
  );
}

/**
 * Fills calendar gaps between the first and last log entry with `null`.
 * Missing days are explicitly preserved as holes rather than coerced to zero.
 */
export function buildCalendarTimeSeries(
  sortedHistory: LogEntry[]
): { date: string; entry: LogEntry | null }[] {
  if (sortedHistory.length === 0) return [];

  const startMs = parseDateUTC(sortedHistory[0].date);
  const endMs = parseDateUTC(sortedHistory[sortedHistory.length - 1].date);
  const entryMap = new Map<string, LogEntry>();

  for (const entry of sortedHistory) {
    entryMap.set(entry.date, entry);
  }

  const timeline: { date: string; entry: LogEntry | null }[] = [];
  let currentMs = startMs;

  while (currentMs <= endMs) {
    const dateStr = formatUTCDate(currentMs);
    timeline.push({
      date: dateStr,
      entry: entryMap.get(dateStr) || null,
    });
    currentMs += MS_PER_DAY;
  }

  return timeline;
}

/**
 * Calculates 7-day rolling trends and 28-day baseline comparisons for all enabled continuous metrics.
 */
export function calculateCalendarRollingTrends(
  history: LogEntry[],
  et: EnabledTrackers
): RollingTrend[] {
  const sorted = sortAndDeduplicateLogs(history);
  if (sorted.length === 0) return [];

  const timeline = buildCalendarTimeSeries(sorted);
  const trends: RollingTrend[] = [];

  const metricExtractors: {
    metric: RollingTrend["metric"];
    enabled: boolean;
    getValue: (e: LogEntry) => number | null;
  }[] = [
    {
      metric: "mood",
      enabled: et.mood,
      getValue: (e) => (typeof e.mood === "number" && !isNaN(e.mood) ? e.mood : null),
    },
    {
      metric: "concentration",
      enabled: et.focus,
      getValue: (e) => (typeof e.concentration === "number" && !isNaN(e.concentration) ? e.concentration : null),
    },
    {
      metric: "sleepDuration",
      enabled: et.sleep,
      getValue: (e) => {
        const val = getTotalSleep(e, et);
        return typeof val === "number" && !isNaN(val) ? val : null;
      },
    },
    {
      metric: "sleepQuality",
      enabled: et.sleep,
      getValue: (e) => (typeof e.sleepQuality === "number" && !isNaN(e.sleepQuality) ? e.sleepQuality : null),
    },
  ];

  for (const { metric, enabled, getValue } of metricExtractors) {
    if (!enabled) continue;

    const values = timeline.map((item) => (item.entry ? getValue(item.entry) : null));

    // Calculate rolling averages across timeline
    const rolling7 = rollingAverage(values, 7, 4); // Need >= 4 observations in 7 calendar days
    const rolling28 = rollingAverage(values, 28, 10); // Need >= 10 observations in 28 calendar days

    // Look at the latest day in timeline
    const lastIndex = values.length - 1;
    const rolling7dAvg = rolling7[lastIndex] ?? null;
    const baseline28dAvg = rolling28[lastIndex] ?? null;

    // Count observed days in the last 7 and 28 calendar days
    const last7Slice = values.slice(Math.max(0, values.length - 7)).filter((v): v is number => v !== null);
    const last28Slice = values.slice(Math.max(0, values.length - 28)).filter((v): v is number => v !== null);
    const count7d = last7Slice.length;
    const count28d = last28Slice.length;

    let delta: number | null = null;
    let zScore: number | null = null;
    let direction: RollingTrend["direction"] = "insufficient_data";

    if (rolling7dAvg !== null && baseline28dAvg !== null) {
      const dev = calculateBaselineDeviation(rolling7dAvg, last28Slice);
      delta = dev.delta;
      zScore = dev.zScore;

      if (delta > 0.3) direction = "improving";
      else if (delta < -0.3) direction = "declining";
      else direction = "stable";
    }

    trends.push({
      metric,
      rolling7dAvg,
      baseline28dAvg,
      delta,
      zScore,
      direction,
      count7d,
      count28d,
    });
  }

  return trends;
}

/**
 * Identifies strictly consecutive day pairs (difference === 1 calendar day).
 */
export function getConsecutivePairs(
  history: LogEntry[]
): { prev: LogEntry; curr: LogEntry }[] {
  const sorted = sortAndDeduplicateLogs(history);
  const pairs: { prev: LogEntry; curr: LogEntry }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (diffCalendarDays(prev.date, curr.date) === 1) {
      pairs.push({ prev, curr });
    }
  }

  return pairs;
}

/**
 * Calculates lagged impacts of habits performed on day t-1 on subsequent day t sleep and focus metrics.
 * Strictly verifies calendar date continuity (pairs separated by > 1 day are excluded).
 */
export function calculateLaggedHabitImpacts(
  history: LogEntry[],
  et: EnabledTrackers,
  lang: "en" | "es"
): LaggedImpact[] {
  const pairs = getConsecutivePairs(history);
  if (pairs.length < MIN_SAMPLE_SIZE) {
    return [];
  }

  const habitNames = new Set<string>();
  pairs.forEach(({ prev }) => {
    prev.tasks?.forEach((t) => {
      if (t.name) habitNames.add(t.name.trim());
    });
  });

  const impacts: LaggedImpact[] = [];

  habitNames.forEach((habitName) => {
    const habitLower = habitName.toLowerCase();

    // Pairs where habit was completed on day t-1
    const pairsWith = pairs.filter(({ prev }) => {
      const task = prev.tasks?.find((t) => t.name.trim().toLowerCase() === habitLower);
      return task ? task.completed : false;
    });

    // Pairs where habit was NOT completed on day t-1
    const pairsWithout = pairs.filter(({ prev }) => {
      const task = prev.tasks?.find((t) => t.name.trim().toLowerCase() === habitLower);
      return !task || !task.completed;
    });

    if (pairsWith.length < MIN_SAMPLE_SIZE || pairsWithout.length < MIN_SAMPLE_SIZE) {
      return;
    }

    // Evaluate subsequent sleep quality on day t
    if (et.sleep) {
      const sleepQualWith = pairsWith.map((p) => p.curr.sleepQuality).filter((v) => typeof v === "number" && !isNaN(v));
      const sleepQualWithout = pairsWithout.map((p) => p.curr.sleepQuality).filter((v) => typeof v === "number" && !isNaN(v));

      if (sleepQualWith.length >= MIN_SAMPLE_SIZE && sleepQualWithout.length >= MIN_SAMPLE_SIZE) {
        const avgWith = parseFloat(mean(sleepQualWith).toFixed(2));
        const avgWithout = parseFloat(mean(sleepQualWithout).toFixed(2));
        const diff = parseFloat((avgWith - avgWithout).toFixed(2));
        const d = effectSize(sleepQualWith, sleepQualWithout);
        const conf = confidenceLevel(sleepQualWith.length, sleepQualWithout.length, d);

        if (conf !== "insufficient" && Math.abs(diff) >= 0.3) {
          const isPos = diff > 0;
          const descEn = isPos
            ? `Completing "${habitName}" yesterday is associated with +${diff} points higher sleep quality the next morning.`
            : `Completing "${habitName}" yesterday is associated with ${diff} points lower sleep quality the next morning.`;
          const descEs = isPos
            ? `Completar "${habitName}" ayer se asocia con +${diff} puntos más en la calidad de sueño de la mañana siguiente.`
            : `Completar "${habitName}" ayer se asocia con ${diff} puntos menos en la calidad de sueño de la mañana siguiente.`;

          impacts.push({
            factorName: habitName,
            factorType: "habit",
            targetMetric: "sleepQuality",
            avgWithPreviousDay: avgWith,
            avgWithoutPreviousDay: avgWithout,
            difference: diff,
            confidence: conf,
            consecutivePairsCount: sleepQualWith.length + sleepQualWithout.length,
            description: lang === "es" ? descEs : descEn,
          });
        }
      }
    }

    // Evaluate subsequent concentration on day t
    if (et.focus) {
      const focusWith = pairsWith.map((p) => p.curr.concentration).filter((v) => typeof v === "number" && !isNaN(v));
      const focusWithout = pairsWithout.map((p) => p.curr.concentration).filter((v) => typeof v === "number" && !isNaN(v));

      if (focusWith.length >= MIN_SAMPLE_SIZE && focusWithout.length >= MIN_SAMPLE_SIZE) {
        const avgWith = parseFloat(mean(focusWith).toFixed(2));
        const avgWithout = parseFloat(mean(focusWithout).toFixed(2));
        const diff = parseFloat((avgWith - avgWithout).toFixed(2));
        const d = effectSize(focusWith, focusWithout);
        const conf = confidenceLevel(focusWith.length, focusWithout.length, d);

        if (conf !== "insufficient" && Math.abs(diff) >= 0.3) {
          const isPos = diff > 0;
          const descEn = isPos
            ? `Completing "${habitName}" yesterday is associated with +${diff} points higher concentration today.`
            : `Completing "${habitName}" yesterday is associated with ${diff} points lower concentration today.`;
          const descEs = isPos
            ? `Completar "${habitName}" ayer se asocia con +${diff} puntos más de concentración hoy.`
            : `Completar "${habitName}" ayer se asocia con ${diff} puntos menos de concentración hoy.`;

          impacts.push({
            factorName: habitName,
            factorType: "habit",
            targetMetric: "concentration",
            avgWithPreviousDay: avgWith,
            avgWithoutPreviousDay: avgWithout,
            difference: diff,
            confidence: conf,
            consecutivePairsCount: focusWith.length + focusWithout.length,
            description: lang === "es" ? descEs : descEn,
          });
        }
      }
    }
  });

  return impacts;
}
