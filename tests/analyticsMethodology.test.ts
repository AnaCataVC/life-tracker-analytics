import { describe, it, expect } from "vitest";
import {
  mean,
  stdDev,
  pearsonCorrelation,
  effectSize,
  confidenceLevel,
  calculateBaselineDeviation,
  rollingAverage,
  filterOutliersIQR,
} from "../src/utils/heuristics/statistics";
import {
  diffCalendarDays,
  parseDateUTC,
  formatUTCDate,
  buildCalendarTimeSeries,
  getConsecutivePairs,
  calculateCalendarRollingTrends,
  calculateLaggedHabitImpacts,
} from "../src/utils/heuristics/timeSeries";
import { LogEntry, EnabledTrackers } from "../src/types";

describe("Deterministic Analytics Methodology & Edge Cases", () => {
  describe("1. Deterministic Monotonic Fixtures", () => {
    it("computes perfect positive linear correlation (r = +1.0) with exact sample count", () => {
      const sleep = [4, 5, 6, 7, 8];
      const focus = [1, 2, 3, 4, 5];

      const r = pearsonCorrelation(sleep, focus);
      expect(r).toBe(1);
    });

    it("computes perfect negative linear correlation (r = -1.0)", () => {
      const sleep = [4, 5, 6, 7, 8];
      const focus = [5, 4, 3, 2, 1];

      const r = pearsonCorrelation(sleep, focus);
      expect(r).toBe(-1);
    });

    it("handles zero variance without dividing by zero or producing NaN", () => {
      const flat = [7, 7, 7, 7, 7];
      const variable = [1, 3, 5, 7, 9];

      expect(stdDev(flat)).toBe(0);
      expect(pearsonCorrelation(flat, variable)).toBe(0);
      expect(pearsonCorrelation(variable, flat)).toBe(0);
    });
  });

  describe("2. Missing Data Semantics (Missing is NOT Zero)", () => {
    it("does not coerce missing values to zero in rolling averages", () => {
      // 5 calendar days, where day index 1 and 3 are missing (null)
      const values: (number | null)[] = [8, null, 8, null, 8];

      // Window size 5, requiring at least 3 observations
      const rolling = rollingAverage(values, 5, 3);

      // The last day sees three 8s (and two nulls). Average must be exactly 8, NOT (8+0+8+0+8)/5 = 4.8
      expect(rolling[4]).toBe(8);
    });

    it("returns null for rolling windows that do not meet the minimum observation threshold", () => {
      const values: (number | null)[] = [null, null, 9];
      const rolling = rollingAverage(values, 3, 2);

      // Only 1 observation present in a 3-day window requiring 2
      expect(rolling[2]).toBeNull();
    });

    it("handles calendar timeline generation with holes", () => {
      const sparseLogs: LogEntry[] = [
        {
          date: "2026-10-01",
          mood: 7,
          sleepQuality: 8,
          bedtime: "23:00",
          waketime: "07:00",
          sleepDuration: 8,
          concentration: 7,
          tasks: [],
          medications: [],
          moodTags: [],
        },
        {
          date: "2026-10-04",
          mood: 8,
          sleepQuality: 7,
          bedtime: "23:30",
          waketime: "07:30",
          sleepDuration: 8,
          concentration: 8,
          tasks: [],
          medications: [],
          moodTags: [],
        },
      ];

      const timeline = buildCalendarTimeSeries(sparseLogs);

      // From 2026-10-01 to 2026-10-04 is 4 calendar days (Oct 1, 2, 3, 4)
      expect(timeline.length).toBe(4);
      expect(timeline[0].entry).not.toBeNull();
      expect(timeline[1].entry).toBeNull(); // 2026-10-02 missing
      expect(timeline[2].entry).toBeNull(); // 2026-10-03 missing
      expect(timeline[3].entry).not.toBeNull(); // 2026-10-04 present
    });
  });

  describe("3. Date Math & Timezone Safety", () => {
    it("calculates exact calendar day differences across month and leap boundaries", () => {
      expect(diffCalendarDays("2026-10-25", "2026-10-26")).toBe(1);
      expect(diffCalendarDays("2026-10-25", "2026-10-25")).toBe(0);
      expect(diffCalendarDays("2026-10-31", "2026-11-01")).toBe(1);
      // Leap year 2024
      expect(diffCalendarDays("2024-02-28", "2024-03-01")).toBe(2);
    });

    it("correctly identifies strictly consecutive pairs and rejects non-consecutive dates", () => {
      const logs: LogEntry[] = [
        { date: "2026-10-10", mood: 6, sleepQuality: 6, bedtime: "23:00", waketime: "07:00", sleepDuration: 8, concentration: 6, tasks: [], medications: [], moodTags: [] },
        { date: "2026-10-11", mood: 7, sleepQuality: 7, bedtime: "23:00", waketime: "07:00", sleepDuration: 8, concentration: 7, tasks: [], medications: [], moodTags: [] },
        // Gap here: missing 2026-10-12
        { date: "2026-10-13", mood: 8, sleepQuality: 8, bedtime: "23:00", waketime: "07:00", sleepDuration: 8, concentration: 8, tasks: [], medications: [], moodTags: [] },
      ];

      const pairs = getConsecutivePairs(logs);

      // Only Oct 10 -> Oct 11 is consecutive; Oct 11 -> Oct 13 is a 2-day gap and must NOT be paired
      expect(pairs.length).toBe(1);
      expect(pairs[0].prev.date).toBe("2026-10-10");
      expect(pairs[0].curr.date).toBe("2026-10-11");
    });
  });

  describe("4. Lagged Relationship Analysis (Lag-1)", () => {
    it("computes habit impact on next-day sleep and concentration", () => {
      // 12 strictly consecutive days
      const history: LogEntry[] = Array.from({ length: 12 }, (_, i) => {
        const dateStr = `2026-10-${String(i + 1).padStart(2, "0")}`;
        const didGymYesterday = i > 0 && (i - 1) % 2 === 0;

        return {
          date: dateStr,
          mood: 7,
          sleepQuality: didGymYesterday ? 9 : 5, // Doing gym yesterday results in 9 sleep quality next morning
          bedtime: "23:00",
          waketime: "07:00",
          sleepDuration: 8,
          concentration: didGymYesterday ? 9 : 5,
          tasks: [{ id: `gym-${i}`, name: "Gym Workout", completed: i % 2 === 0 }],
          medications: [],
          moodTags: [],
        };
      });

      const et: EnabledTrackers = { mood: true, sleep: true, focus: true, medications: true, tasks: true };
      const lagged = calculateLaggedHabitImpacts(history, et, "en");

      expect(lagged.length).toBeGreaterThan(0);
      const gymSleepImpact = lagged.find((l) => l.factorName === "Gym Workout" && l.targetMetric === "sleepQuality");
      expect(gymSleepImpact).toBeDefined();
      expect(gymSleepImpact?.difference).toBeGreaterThanOrEqual(3.0);
      expect(gymSleepImpact?.confidence).not.toBe("insufficient");
    });
  });

  describe("5. Baseline Deviations & Z-Scores", () => {
    it("computes z-score and deviation accurately against known baseline", () => {
      // Baseline values: [2, 4, 4, 4, 5, 5, 7, 9] (mean = 5, sd = 2)
      const baseline = [2, 4, 4, 4, 5, 5, 7, 9];

      const highDev = calculateBaselineDeviation(9, baseline);
      expect(highDev.delta).toBe(4);
      expect(highDev.zScore).toBe(2);
      expect(highDev.direction).toBe("above");

      const lowDev = calculateBaselineDeviation(1, baseline);
      expect(lowDev.delta).toBe(-4);
      expect(lowDev.zScore).toBe(-2);
      expect(lowDev.direction).toBe("below");

      const neutralDev = calculateBaselineDeviation(5, baseline);
      expect(neutralDev.delta).toBe(0);
      expect(neutralDev.zScore).toBe(0);
      expect(neutralDev.direction).toBe("baseline");
    });
  });

  describe("6. Outlier Management (IQR)", () => {
    it("trims extreme outliers that would distort longitudinal metrics", () => {
      // Normal sleep values around 7-8 hours, with an accidental 24h entry
      const sleepHours = [6.5, 7.0, 7.5, 7.5, 8.0, 8.0, 8.5, 24.0];
      const filtered = filterOutliersIQR(sleepHours);

      expect(filtered).not.toContain(24.0);
      expect(filtered.length).toBe(7);
      expect(mean(filtered)).toBeLessThan(8.0);
    });

    it("preserves small arrays without crashing", () => {
      expect(filterOutliersIQR([])).toEqual([]);
      expect(filterOutliersIQR([8])).toEqual([8]);
      expect(filterOutliersIQR([7, 8, 9])).toEqual([7, 8, 9]);
    });
  });

  describe("7. Rolling Trends Directionality", () => {
    it("identifies improving trend when recent 7d average exceeds 28d baseline", () => {
      // 14 consecutive days with improving mood (started at 4, ended at 9)
      const history: LogEntry[] = Array.from({ length: 14 }, (_, i) => ({
        date: `2026-10-${String(i + 1).padStart(2, "0")}`,
        mood: 4 + (i * 0.4), // 4.0 up to 9.2
        sleepQuality: 7,
        bedtime: "23:00",
        waketime: "07:00",
        sleepDuration: 8,
        concentration: 7,
        tasks: [],
        medications: [],
        moodTags: [],
      }));

      const et: EnabledTrackers = { mood: true, sleep: true, focus: true, medications: true, tasks: true };
      const trends = calculateCalendarRollingTrends(history, et);

      const moodTrend = trends.find((t) => t.metric === "mood");
      expect(moodTrend).toBeDefined();
      expect(moodTrend?.direction).toBe("improving");
      expect(moodTrend?.delta).toBeGreaterThan(0.3);
    });
  });
});
