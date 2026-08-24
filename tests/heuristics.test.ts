import { describe, it, expect } from "vitest";
import {
  mean,
  stdDev,
  pearsonCorrelation,
  effectSize,
  confidenceLevel,
  pearsonDirection,
  formatPearsonR,
  MIN_SAMPLE_SIZE,
} from "../src/utils/heuristics/statistics";
import { generateScoringAndSummary } from "../src/utils/heuristics/scoring";
import { generateCorrelations } from "../src/utils/heuristics/correlations";
import { calculateIndividualImpacts } from "../src/utils/heuristics/individualImpacts";
import { calculateLocalInsights } from "../src/utils/heuristics";
import { LogEntry, EnabledTrackers } from "../src/types";

describe("Heuristics Statistics & Engines", () => {
  describe("statistics.ts pure math", () => {
    it("should calculate mean correctly", () => {
      expect(mean([])).toBe(0);
      expect(mean([10])).toBe(10);
      expect(mean([2, 4, 6, 8])).toBe(5);
    });

    it("should calculate stdDev correctly", () => {
      expect(stdDev([])).toBe(0);
      expect(stdDev([5])).toBe(0);
      // population std dev of [2, 4, 4, 4, 5, 5, 7, 9] (mean = 5, variance = 4, stdDev = 2)
      expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    });

    it("should calculate Pearson Correlation accurately", () => {
      // Less than MIN_SAMPLE_SIZE
      expect(pearsonCorrelation([1, 2, 3], [1, 2, 3])).toBe(0);

      // Perfect positive correlation
      const xs = [1, 2, 3, 4, 5, 6];
      const ys = [2, 4, 6, 8, 10, 12];
      expect(pearsonCorrelation(xs, ys)).toBe(1);

      // Perfect negative correlation
      const ysNeg = [12, 10, 8, 6, 4, 2];
      expect(pearsonCorrelation(xs, ysNeg)).toBe(-1);

      // Zero variance
      expect(pearsonCorrelation([5, 5, 5, 5, 5], [1, 2, 3, 4, 5])).toBe(0);
    });

    it("should compute effectSize (Cohen's d) correctly", () => {
      const gA = [10, 10, 10, 10, 10];
      const gB = [10, 10, 10, 10, 10];
      expect(effectSize(gA, gB)).toBe(0);

      const g1 = [1, 2, 3, 4, 5];
      const g2 = [6, 7, 8, 9, 10];
      expect(effectSize(g1, g2)).toBeGreaterThan(2.0);
    });

    it("should determine confidenceLevel correctly", () => {
      expect(confidenceLevel(3, 5, 0.8)).toBe("insufficient");
      expect(confidenceLevel(5, 5, 0.1)).toBe("low");
      expect(confidenceLevel(6, 6, 0.4)).toBe("moderate");
      expect(confidenceLevel(12, 15, 0.6)).toBe("high");
    });

    it("should map pearson directions and labels", () => {
      expect(pearsonDirection(0.5)).toBe("positive");
      expect(pearsonDirection(-0.4)).toBe("negative");
      expect(pearsonDirection(0.1)).toBe("neutral");

      expect(formatPearsonR(0.72)).toBe("r = +0.72");
      expect(formatPearsonR(-0.45)).toBe("r = −0.45");
    });
  });

  describe("scoring.ts", () => {
    it("should calculate well-being score bounded between 1 and 100", () => {
      const { wellbeingScore, overallSummary } = generateScoringAndSummary("en", 8, 7, 8, 8);
      expect(wellbeingScore).toBeGreaterThanOrEqual(1);
      expect(wellbeingScore).toBeLessThanOrEqual(100);
      expect(overallSummary).toContain("average daily mood of 8.0/10");
    });

    it("should generate bilingual summary in Spanish", () => {
      const { overallSummary } = generateScoringAndSummary("es", 9, 9, 8, 9);
      expect(overallSummary).toContain("Tus registros indican un estado de ánimo");
      expect(overallSummary).toContain("Tu descanso es sumamente reparador");
    });
  });

  describe("correlations.ts, individualImpacts.ts and calculateLocalInsights", () => {
    const et: EnabledTrackers = {
      mood: true,
      sleep: true,
      focus: true,
      medications: true,
      tasks: true,
    };

    const mockHistory: LogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      mood: 5 + (i % 5),
      sleepQuality: 6 + (i % 4),
      sleepDuration: 6 + (i % 3),
      bedtime: "23:00",
      waketime: "07:00",
      concentration: 6 + (i % 4),
      medications: [{ id: `med-${i}`, name: "Melatonin", dosage: "5mg", taken: i % 2 === 0 }],
      tasks: [{ id: `task-${i}`, name: "Gym", completed: i % 2 === 0 }],
      moodTags: i % 2 === 0 ? ["Energized", "Productive"] : ["Tired"],
    }));

    it("should generate correlations when dataset size >= MIN_SAMPLE_SIZE", () => {
      const correlations = generateCorrelations(mockHistory, "en", et, 7, 7);
      expect(correlations.length).toBeGreaterThan(0);
      expect(correlations[0]).toHaveProperty("direction");
      expect(correlations[0]).toHaveProperty("description");
    });

    it("should return empty correlations when history is too small", () => {
      const smallHistory = mockHistory.slice(0, 3);
      const correlations = generateCorrelations(smallHistory, "en", et, 7, 7);
      expect(correlations).toEqual([]);
    });

    it("should compute individual factor impacts for habits and medications", () => {
      const impacts = calculateIndividualImpacts(mockHistory, et);
      expect(impacts.length).toBeGreaterThanOrEqual(1);

      const gymImpact = impacts.find((imp) => imp.name === "Gym");
      expect(gymImpact).toBeDefined();
      expect(gymImpact?.type).toBe("habit");
      expect(gymImpact?.daysCompleted).toBe(5);
      expect(gymImpact?.daysPresent).toBe(10);
    });

    it("should generate full offline insights with calculateLocalInsights", () => {
      const insights = calculateLocalInsights(mockHistory, "es", et);
      expect(insights.wellbeingScore).toBeGreaterThan(0);
      expect(insights.individualImpacts).toBeDefined();
      expect(insights.overallSummary).toBeTruthy();
    });
  });
});
