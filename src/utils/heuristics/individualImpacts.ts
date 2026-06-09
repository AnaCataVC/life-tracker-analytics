import { LogEntry, EnabledTrackers } from "../../types";
import { getTotalSleep } from "../helpers";

export function calculateIndividualImpacts(
  history: LogEntry[],
  et: EnabledTrackers
): any[] {
  const allHabitNames = new Set<string>();
  history.forEach(entry => {
    entry.tasks?.forEach(t => {
      if (t.name) allHabitNames.add(t.name.trim());
    });
  });

  const allMedicationKeys = new Map<string, string>();
  history.forEach(entry => {
    entry.medications?.forEach(m => {
      if (m.name) {
        const key = m.name.trim().toLowerCase();
        if (!allMedicationKeys.has(key)) {
          allMedicationKeys.set(key, m.dosage || "");
        }
      }
    });
  });

  const individualImpacts: any[] = [];

  const getAssociatedTags = (daysWith: LogEntry[], daysWithout: LogEntry[]): string[] => {
    if (!et.mood || daysWith.length === 0) return [];

    const getTopTags = (daysSubset: LogEntry[]) => {
      const tagCounts = new Map<string, number>();
      daysSubset.forEach(e => {
        e.moodTags?.forEach(t => {
          tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        });
      });
      const tagFreqs = new Map<string, number>();
      tagCounts.forEach((count, tag) => {
        tagFreqs.set(tag, count / daysSubset.length);
      });
      return tagFreqs;
    };

    const freqsWith = getTopTags(daysWith);
    const freqsWithout = getTopTags(daysWithout);

    const associatedTags: string[] = [];
    freqsWith.forEach((freqWith, tag) => {
      const freqWithout = freqsWithout.get(tag) || 0;
      if (freqWith >= 0.20 && freqWith >= freqWithout + 0.15) {
        associatedTags.push(tag);
      }
    });

    associatedTags.sort((a, b) => {
      const diffA = freqsWith.get(a)! - (freqsWithout.get(a) || 0);
      const diffB = freqsWith.get(b)! - (freqsWithout.get(b) || 0);
      return diffB - diffA;
    });

    return associatedTags;
  };

  if (et.tasks) {
    allHabitNames.forEach(habitName => {
      const habitNameLower = habitName.toLowerCase();
    
      const daysWith = history.filter(entry => {
        const task = entry.tasks?.find(t => t.name.trim().toLowerCase() === habitNameLower);
        return task ? task.completed : false;
      });
      
      const daysWithout = history.filter(entry => {
        const task = entry.tasks?.find(t => t.name.trim().toLowerCase() === habitNameLower);
        return !task || !task.completed;
      });

      const daysPresent = history.filter(entry => {
        return entry.tasks?.some(t => t.name.trim().toLowerCase() === habitNameLower);
      }).length;

      const daysCompleted = daysWith.length;

      const avgMoodWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.mood, 0) / daysWith.length : 0;
      const avgMoodWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.mood, 0) / daysWithout.length : 0;

      const avgFocusWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.concentration, 0) / daysWith.length : 0;
      const avgFocusWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.concentration, 0) / daysWithout.length : 0;

      const avgSleepDurWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + getTotalSleep(e, et), 0) / daysWith.length : 0;
      const avgSleepDurWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + getTotalSleep(e, et), 0) / daysWithout.length : 0;

      const avgSleepQualWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.sleepQuality, 0) / daysWith.length : 0;
      const avgSleepQualWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.sleepQuality, 0) / daysWithout.length : 0;

      const moodDifference = et.mood && daysWith.length > 0 && daysWithout.length > 0 ? avgMoodWith - avgMoodWithout : 0;
      const focusDifference = et.focus && daysWith.length > 0 && daysWithout.length > 0 ? avgFocusWith - avgFocusWithout : 0;
      const sleepDurDifference = et.sleep && daysWith.length > 0 && daysWithout.length > 0 ? avgSleepDurWith - avgSleepDurWithout : 0;
      const sleepQualDifference = et.sleep && daysWith.length > 0 && daysWithout.length > 0 ? avgSleepQualWith - avgSleepQualWithout : 0;

      individualImpacts.push({
        name: habitName,
        type: "habit",
        daysPresent,
        daysCompleted,
        avgMoodWith: parseFloat(avgMoodWith.toFixed(2)),
        avgMoodWithout: parseFloat(avgMoodWithout.toFixed(2)),
        avgFocusWith: parseFloat(avgFocusWith.toFixed(2)),
        avgFocusWithout: parseFloat(avgFocusWithout.toFixed(2)),
        avgSleepDurWith: parseFloat(avgSleepDurWith.toFixed(2)),
        avgSleepDurWithout: parseFloat(avgSleepDurWithout.toFixed(2)),
        avgSleepQualWith: parseFloat(avgSleepQualWith.toFixed(2)),
        avgSleepQualWithout: parseFloat(avgSleepQualWithout.toFixed(2)),
        moodDifference: parseFloat(moodDifference.toFixed(2)),
        focusDifference: parseFloat(focusDifference.toFixed(2)),
        sleepDurDifference: parseFloat(sleepDurDifference.toFixed(2)),
        sleepQualDifference: parseFloat(sleepQualDifference.toFixed(2)),
        associatedTags: getAssociatedTags(daysWith, daysWithout)
      });
    });
  }

  if (et.medications) {
    allMedicationKeys.forEach((dosage, medNameKey) => {
      let originalName = medNameKey;
      for (const entry of history) {
        const found = entry.medications?.find(m => m.name.trim().toLowerCase() === medNameKey);
        if (found) {
          originalName = found.name.trim();
          break;
        }
      }

      const daysWith = history.filter(entry => {
        const med = entry.medications?.find(m => m.name.trim().toLowerCase() === medNameKey);
        return med ? med.taken : false;
      });

      const daysWithout = history.filter(entry => {
        const med = entry.medications?.find(m => m.name.trim().toLowerCase() === medNameKey);
        return !med || !med.taken;
      });

      const daysPresent = history.filter(entry => {
        return entry.medications?.some(m => m.name.trim().toLowerCase() === medNameKey);
      }).length;

      const daysCompleted = daysWith.length;

      const avgMoodWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.mood, 0) / daysWith.length : 0;
      const avgMoodWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.mood, 0) / daysWithout.length : 0;

      const avgFocusWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.concentration, 0) / daysWith.length : 0;
      const avgFocusWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.concentration, 0) / daysWithout.length : 0;

      const avgSleepDurWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + getTotalSleep(e, et), 0) / daysWith.length : 0;
      const avgSleepDurWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + getTotalSleep(e, et), 0) / daysWithout.length : 0;

      const avgSleepQualWith = daysWith.length > 0 ? daysWith.reduce((s, e) => s + e.sleepQuality, 0) / daysWith.length : 0;
      const avgSleepQualWithout = daysWithout.length > 0 ? daysWithout.reduce((s, e) => s + e.sleepQuality, 0) / daysWithout.length : 0;

      const moodDifference = et.mood && daysWith.length > 0 && daysWithout.length > 0 ? avgMoodWith - avgMoodWithout : 0;
      const focusDifference = et.focus && daysWith.length > 0 && daysWithout.length > 0 ? avgFocusWith - avgFocusWithout : 0;
      const sleepDurDifference = et.sleep && daysWith.length > 0 && daysWithout.length > 0 ? avgSleepDurWith - avgSleepDurWithout : 0;
      const sleepQualDifference = et.sleep && daysWith.length > 0 && daysWithout.length > 0 ? avgSleepQualWith - avgSleepQualWithout : 0;

      individualImpacts.push({
        name: originalName,
        type: "medication",
        dosage,
        daysPresent,
        daysCompleted,
        avgMoodWith: parseFloat(avgMoodWith.toFixed(2)),
        avgMoodWithout: parseFloat(avgMoodWithout.toFixed(2)),
        avgFocusWith: parseFloat(avgFocusWith.toFixed(2)),
        avgFocusWithout: parseFloat(avgFocusWithout.toFixed(2)),
        avgSleepDurWith: parseFloat(avgSleepDurWith.toFixed(2)),
        avgSleepDurWithout: parseFloat(avgSleepDurWithout.toFixed(2)),
        avgSleepQualWith: parseFloat(avgSleepQualWith.toFixed(2)),
        avgSleepQualWithout: parseFloat(avgSleepQualWithout.toFixed(2)),
        moodDifference: parseFloat(moodDifference.toFixed(2)),
        focusDifference: parseFloat(focusDifference.toFixed(2)),
        sleepDurDifference: parseFloat(sleepDurDifference.toFixed(2)),
        sleepQualDifference: parseFloat(sleepQualDifference.toFixed(2)),
        associatedTags: getAssociatedTags(daysWith, daysWithout)
      });
    });
  }

  return individualImpacts;
}
