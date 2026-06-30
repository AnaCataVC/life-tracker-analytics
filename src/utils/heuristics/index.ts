import { LogEntry, WellBeingInsights, EnabledTrackers, IndividualFactorImpact } from "../../types";
import { getTotalSleep } from "../helpers";
import { mean } from "./statistics";

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
  const avgMood = mean(history.map((entry) => entry.mood));
  const avgSleepQual = mean(history.map((entry) => entry.sleepQuality));
  const avgSleepDur = mean(history.map((entry) => getTotalSleep(entry, et)));
  const avgFocus = mean(history.map((entry) => entry.concentration));

  const correlations = generateCorrelations(history, lang, et, avgMood, avgFocus);
  
  const individualImpacts: IndividualFactorImpact[] = calculateIndividualImpacts(history, et);
  
  const { actionableInsights, positives, warnings } = generateActionableInsights(
    lang, et, avgSleepDur, avgSleepQual, individualImpacts
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
