import { LogEntry, WellBeingInsights, EnabledTrackers } from "../../types";
import { getTotalSleep } from "../helpers";

import { generateCorrelations } from "./correlations";
import { calculateIndividualImpacts } from "./individualImpacts";
import { generateActionableInsights } from "./actionable";
import { generateScoringAndSummary } from "./scoring";

/**
 * Calculates offline statistical insights from log history without any AI API calls.
 */
export function calculateLocalInsights(
  history: LogEntry[],
  lang: "en" | "es",
  enabledTrackers?: EnabledTrackers
): WellBeingInsights {
  // Default to all enabled if not provided
  const et = enabledTrackers || {
    mood: true,
    sleep: true,
    focus: true,
    medications: true,
    tasks: true
  };

  if (!history || history.length === 0) {
    return {
      overallSummary: lang === "es" ? "Registra más días para calcular." : "Register more days.",
      wellbeingScore: 0,
      correlations: [],
      actionableInsights: [],
      positives: [],
      warnings: []
    };
  }

  // Calculate generic base parameters
  const totalDays = history.length;
  const avgMood = history.reduce((sum, entry) => sum + entry.mood, 0) / totalDays;
  const avgSleepQual = history.reduce((sum, entry) => sum + entry.sleepQuality, 0) / totalDays;
  const avgSleepDur = history.reduce((sum, entry) => sum + getTotalSleep(entry, et), 0) / totalDays;
  const avgFocus = history.reduce((sum, entry) => sum + entry.concentration, 0) / totalDays;

  const correlations = generateCorrelations(history, lang, et, avgMood, avgFocus);
  
  const individualImpacts = calculateIndividualImpacts(history, et);
  
  const { actionableInsights, positives, warnings } = generateActionableInsights(
    lang, et, avgSleepDur, avgSleepQual, avgMood, avgFocus, individualImpacts
  );

  const { overallSummary, wellbeingScore } = generateScoringAndSummary(
    lang, avgMood, avgFocus, avgSleepDur, avgSleepQual
  );

  return {
    overallSummary,
    wellbeingScore,
    correlations,
    actionableInsights,
    positives,
    warnings,
    individualImpacts
  };
}
