import { LogEntry, EnabledTrackers, IndividualFactorImpact } from "../../types";
import { getTotalSleep } from "../helpers";
import {
  mean,
  hasSufficientSamples,
  effectSize,
  confidenceLevel,
  MIN_SAMPLE_SIZE,
} from "./statistics";

/**
 * Extracts mood-tag frequency associations between two groups of days.
 * Requires at least MIN_SAMPLE_SIZE days in the "with" group before computing.
 *
 * A tag is considered associated only if it appears on at least 20% of "with" days
 * AND its frequency is at least 15 percentage points higher than in the "without" group.
 */
function getAssociatedTags(
  daysWith: LogEntry[],
  daysWithout: LogEntry[],
  et: EnabledTrackers
): string[] {
  if (!et.mood || daysWith.length < MIN_SAMPLE_SIZE) return [];

  const tagFrequency = (days: LogEntry[]): Map<string, number> => {
    const counts = new Map<string, number>();
    days.forEach((e) => e.moodTags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const freqs = new Map<string, number>();
    counts.forEach((count, tag) => freqs.set(tag, count / days.length));
    return freqs;
  };

  const freqsWith = tagFrequency(daysWith);
  const freqsWithout = tagFrequency(daysWithout);

  const associated: string[] = [];
  freqsWith.forEach((freqWith, tag) => {
    const freqWithout = freqsWithout.get(tag) || 0;
    if (freqWith >= 0.20 && freqWith >= freqWithout + 0.15) {
      associated.push(tag);
    }
  });

  // Sort by largest frequency difference descending
  associated.sort((a, b) => {
    const diffA = freqsWith.get(a)! - (freqsWithout.get(a) || 0);
    const diffB = freqsWith.get(b)! - (freqsWithout.get(b) || 0);
    return diffB - diffA;
  });

  return associated;
}

/**
 * Computes the statistical impact of each tracked habit and medication
 * across the full log history.
 *
 * Key design decisions:
 * - Both groups (with/without) must have >= MIN_SAMPLE_SIZE entries for a
 *   comparison to be computed; otherwise all deltas remain 0 and confidence
 *   is marked "insufficient".
 * - Differences are direct group-vs-group comparisons (not against a global
 *   average), preventing baseline contamination.
 * - A "confidence" tier is attached to every result so consumers can filter
 *   or present accordingly.
 */
export function calculateIndividualImpacts(
  history: LogEntry[],
  et: EnabledTrackers
): IndividualFactorImpact[] {
  const allHabitNames = new Set<string>();
  history.forEach((entry) => entry.tasks?.forEach((t) => { if (t.name) allHabitNames.add(t.name.trim()); }));

  const allMedicationKeys = new Map<string, string>();
  history.forEach((entry) => {
    entry.medications?.forEach((m) => {
      if (m.name) {
        const key = m.name.trim().toLowerCase();
        if (!allMedicationKeys.has(key)) allMedicationKeys.set(key, m.dosage || "");
      }
    });
  });

  const impacts: IndividualFactorImpact[] = [];

  /**
   * Shared computation for a habit or medication given its "with" and "without" groups.
   */
  const computeImpact = (
    daysWith: LogEntry[],
    daysWithout: LogEntry[]
  ): Pick<
    IndividualFactorImpact,
    | "avgMoodWith" | "avgMoodWithout"
    | "avgFocusWith" | "avgFocusWithout"
    | "avgSleepDurWith" | "avgSleepDurWithout"
    | "avgSleepQualWith" | "avgSleepQualWithout"
    | "moodDifference" | "focusDifference"
    | "sleepDurDifference" | "sleepQualDifference"
    | "confidence"
  > => {
    const sufficient = hasSufficientSamples(daysWith, daysWithout);

    if (!sufficient) {
      return {
        avgMoodWith: daysWith.length > 0 ? parseFloat(mean(daysWith.map((e) => e.mood)).toFixed(2)) : 0,
        avgMoodWithout: daysWithout.length > 0 ? parseFloat(mean(daysWithout.map((e) => e.mood)).toFixed(2)) : 0,
        avgFocusWith: 0,
        avgFocusWithout: 0,
        avgSleepDurWith: 0,
        avgSleepDurWithout: 0,
        avgSleepQualWith: 0,
        avgSleepQualWithout: 0,
        moodDifference: 0,
        focusDifference: 0,
        sleepDurDifference: 0,
        sleepQualDifference: 0,
        confidence: "insufficient",
      };
    }

    // Compute group averages
    const avgMoodWith = parseFloat(mean(daysWith.map((e) => e.mood)).toFixed(2));
    const avgMoodWithout = parseFloat(mean(daysWithout.map((e) => e.mood)).toFixed(2));
    const avgFocusWith = parseFloat(mean(daysWith.map((e) => e.concentration)).toFixed(2));
    const avgFocusWithout = parseFloat(mean(daysWithout.map((e) => e.concentration)).toFixed(2));
    const avgSleepDurWith = et.sleep
      ? parseFloat(mean(daysWith.map((e) => getTotalSleep(e, et))).toFixed(2))
      : 0;
    const avgSleepDurWithout = et.sleep
      ? parseFloat(mean(daysWithout.map((e) => getTotalSleep(e, et))).toFixed(2))
      : 0;
    const avgSleepQualWith = et.sleep
      ? parseFloat(mean(daysWith.map((e) => e.sleepQuality)).toFixed(2))
      : 0;
    const avgSleepQualWithout = et.sleep
      ? parseFloat(mean(daysWithout.map((e) => e.sleepQuality)).toFixed(2))
      : 0;

    // Direct group-vs-group differences (isolated; NOT compared to global avg)
    const moodDifference = et.mood ? parseFloat((avgMoodWith - avgMoodWithout).toFixed(2)) : 0;
    const focusDifference = et.focus ? parseFloat((avgFocusWith - avgFocusWithout).toFixed(2)) : 0;
    const sleepDurDifference = et.sleep ? parseFloat((avgSleepDurWith - avgSleepDurWithout).toFixed(2)) : 0;
    const sleepQualDifference = et.sleep ? parseFloat((avgSleepQualWith - avgSleepQualWithout).toFixed(2)) : 0;

    // Use mood difference (primary signal) to determine Cohen's d and confidence tier
    const d = effectSize(daysWith.map((e) => e.mood), daysWithout.map((e) => e.mood));
    const confidence = confidenceLevel(daysWith.length, daysWithout.length, d);

    return {
      avgMoodWith,
      avgMoodWithout,
      avgFocusWith,
      avgFocusWithout,
      avgSleepDurWith,
      avgSleepDurWithout,
      avgSleepQualWith,
      avgSleepQualWithout,
      moodDifference,
      focusDifference,
      sleepDurDifference,
      sleepQualDifference,
      confidence,
    };
  };

  // ── Habits ──────────────────────────────────────────────────────────────────
  if (et.tasks) {
    allHabitNames.forEach((habitName) => {
      const habitNameLower = habitName.toLowerCase();

      const daysWith = history.filter((entry) => {
        const task = entry.tasks?.find((t) => t.name.trim().toLowerCase() === habitNameLower);
        return task ? task.completed : false;
      });

      const daysWithout = history.filter((entry) => {
        const task = entry.tasks?.find((t) => t.name.trim().toLowerCase() === habitNameLower);
        return !task || !task.completed;
      });

      const daysPresent = history.filter((entry) =>
        entry.tasks?.some((t) => t.name.trim().toLowerCase() === habitNameLower)
      ).length;

      impacts.push({
        name: habitName,
        type: "habit",
        daysPresent,
        daysCompleted: daysWith.length,
        associatedTags: getAssociatedTags(daysWith, daysWithout, et),
        ...computeImpact(daysWith, daysWithout),
      });
    });
  }

  // ── Medications ─────────────────────────────────────────────────────────────
  if (et.medications) {
    allMedicationKeys.forEach((dosage, medNameKey) => {
      let originalName = medNameKey;
      for (const entry of history) {
        const found = entry.medications?.find((m) => m.name.trim().toLowerCase() === medNameKey);
        if (found) { originalName = found.name.trim(); break; }
      }

      const daysWith = history.filter((entry) => {
        const med = entry.medications?.find((m) => m.name.trim().toLowerCase() === medNameKey);
        return med ? med.taken : false;
      });

      const daysWithout = history.filter((entry) => {
        const med = entry.medications?.find((m) => m.name.trim().toLowerCase() === medNameKey);
        return !med || !med.taken;
      });

      const daysPresent = history.filter((entry) =>
        entry.medications?.some((m) => m.name.trim().toLowerCase() === medNameKey)
      ).length;

      impacts.push({
        name: originalName,
        type: "medication",
        dosage,
        daysPresent,
        daysCompleted: daysWith.length,
        associatedTags: getAssociatedTags(daysWith, daysWithout, et),
        ...computeImpact(daysWith, daysWithout),
      });
    });
  }

  return impacts;
}
