import { ActionableInsight, EnabledTrackers, IndividualFactorImpact } from "../../types";
import { translations } from "../translations";

/**
 * Generates actionable insights, positives, and warnings from averaged metrics
 * and pre-computed individual factor impacts.
 *
 * Design decisions:
 * - All causal language ("harms you", "helps you") has been replaced with
 *   associative language ("is associated with lower/higher...") to avoid
 *   misleading the user about correlation vs. causation.
 * - Insights for habits/medications are only generated when confidence is
 *   "high" or "moderate". "low" and "insufficient" entries are silently skipped.
 * - Positives/warnings for habits compare the "with" group directly against the
 *   "without" group (moodDifference = avgMoodWith - avgMoodWithout) instead of
 *   comparing against a contaminated global average.
 * - A "(limited data)" disclaimer is appended for "moderate" confidence items.
 */
export function generateActionableInsights(
  lang: "en" | "es",
  et: EnabledTrackers,
  avgSleepDur: number,
  avgSleepQual: number,
  individualImpacts: IndividualFactorImpact[]
): { actionableInsights: ActionableInsight[]; positives: string[]; warnings: string[] } {
  const t = translations[lang];
  const actionableInsights: ActionableInsight[] = [];
  const positives: string[] = [];
  const warnings: string[] = [];

  const limitedDataLabel = lang === "es" ? " (datos limitados)" : " (limited data)";

  // ── Sleep Duration Advice ────────────────────────────────────────────────────
  if (et.sleep) {
    if (avgSleepDur < 7.0) {
      if (et.focus) {
        actionableInsights.push({
          habit:
            lang === "es"
              ? "Avanzar la hora de dormir 30 minutos"
              : "Advance bedtime by 30 minutes",
          impact:
            lang === "es"
              ? `Tu promedio de sueño actual es de ${avgSleepDur.toFixed(1)}h. Acercarlo al rango de 7-8h podría asociarse con mayor claridad mental.`
              : `Your sleep average is ${avgSleepDur.toFixed(1)}h. Moving into the 7-8h range may be associated with improved cognitive clarity.`,
          targetArea: lang === "es" ? "Sueño y Enfoque" : "Sleep & Focus",
          difficulty: "Easy",
        });
      }
      warnings.push(
        lang === "es"
          ? `Promedio de sueño reducido (${avgSleepDur.toFixed(1)} horas), lo que puede asociarse con menor rendimiento.`
          : `Short sleep average logged (${avgSleepDur.toFixed(1)} hours), which may be associated with reduced performance.`
      );
    } else {
      positives.push(
        lang === "es"
          ? `¡Estupendo! Promedio de sueño saludable de ${avgSleepDur.toFixed(1)} horas por noche.`
          : `Great work maintaining an average sleep of ${avgSleepDur.toFixed(1)} hours.`
      );
    }

    // Sleep Quality Advice
    if (avgSleepQual < 6.5) {
      actionableInsights.push({
        habit:
          lang === "es"
            ? "Limitar pantallas 1 hora antes de dormir"
            : "Restrict digital screens 1 hour before sleep",
        impact:
          lang === "es"
            ? `La calidad de descanso actual está algo baja (${avgSleepQual.toFixed(1)}/10). Reducir la exposición a pantallas puede estar asociado con un descanso más profundo.`
            : `Rest quality is currently a bit low at ${avgSleepQual.toFixed(1)}/10. Reducing screen exposure may be associated with deeper sleep.`,
        targetArea: lang === "es" ? "Calidad de Sueño" : "Sleep Quality",
        difficulty: "Medium",
      });
      warnings.push(
        lang === "es"
          ? `Registros muestran noches con calidad de sueño reducida (promedio ${avgSleepQual.toFixed(1)}/10).`
          : `Frequent low-quality nights detected (quality average ${avgSleepQual.toFixed(1)}/10).`
      );
    } else {
      positives.push(
        lang === "es"
          ? "Calidad de sueño promedio saludable y consistente."
          : "Healthy and consistent sleep quality baseline."
      );
    }
  }

  // ── Fallback Actionable Insight ──────────────────────────────────────────────
  if (actionableInsights.length === 0 && et.mood) {
    actionableInsights.push({
      habit:
        lang === "es"
          ? "Añadir un diario de gratitud de una línea"
          : "Incorporate a 1-line gratitude entry",
      impact:
        lang === "es"
          ? "Consolida los días positivos y puede reforzar el bienestar a largo plazo."
          : "Anchors positive days and may reinforce long-term mood.",
      targetArea: lang === "es" ? "Estado de Ánimo" : "Mood",
      difficulty: "Easy",
    });
  }

  // ── Habit / Medication Insights ──────────────────────────────────────────────
  individualImpacts.forEach((impact) => {
    // Skip entries without enough data to be informative
    if (impact.confidence === "insufficient" || impact.confidence === "low") return;

    const disclaimer = impact.confidence === "moderate" ? limitedDataLabel : "";
    const missedDays = impact.daysPresent - impact.daysCompleted;
    const actionNounEs = impact.type === "medication" ? "tomar" : "cumplir";
    const actionNounEn = impact.type === "medication" ? "taking" : "completing";
    const actionCapEs = impact.type === "medication" ? "Tomar" : "Cumplir";
    const actionCapEn = impact.type === "medication" ? "Taking" : "Completing";

    if (missedDays >= 1) {
      // --- Positive Association (With > Without) ---
      if (et.mood && impact.moodDifference >= 0.5) {
        positives.push(
          lang === "es"
            ? `${actionCapEs} "${impact.name}" se asocia con un ánimo más alto (+${impact.moodDifference.toFixed(1)} pts vs días sin hacerlo).${disclaimer}`
            : `${actionCapEn} "${impact.name}" is associated with higher mood (+${impact.moodDifference.toFixed(1)} pts vs days without).${disclaimer}`
        );
      } else if (et.focus && impact.focusDifference >= 0.5) {
        positives.push(
          lang === "es"
            ? `${actionCapEs} "${impact.name}" se asocia con mayor enfoque (+${impact.focusDifference.toFixed(1)} pts vs días sin hacerlo).${disclaimer}`
            : `${actionCapEn} "${impact.name}" is associated with better focus (+${impact.focusDifference.toFixed(1)} pts vs days without).${disclaimer}`
        );
      }

      // --- Negative Association (Without > With) ---
      // Uses direct group difference (moodDifference = avgMoodWith - avgMoodWithout),
      // so a negative value means days without scored higher.
      const moodDrop = -impact.moodDifference; // positive means skipping correlates with lower mood
      const focusDrop = -impact.focusDifference;

      if (et.mood && moodDrop >= 0.5 && impact.avgMoodWithout > 0) {
        warnings.push(
          lang === "es"
            ? `Los días sin ${actionNounEs} "${impact.name}" se asocian con un ánimo más bajo (${impact.avgMoodWithout.toFixed(1)} vs ${impact.avgMoodWith.toFixed(1)} con él).${disclaimer}`
            : `Days without ${actionNounEn} "${impact.name}" are associated with lower mood (${impact.avgMoodWithout.toFixed(1)} vs ${impact.avgMoodWith.toFixed(1)} with it).${disclaimer}`
        );
        if (moodDrop >= 0.8) {
          const exists = actionableInsights.some((a) => a.habit.includes(impact.name));
          if (!exists) {
            actionableInsights.push({
              habit:
                lang === "es"
                  ? `Mantener "${impact.name}" en tu rutina`
                  : `Consider maintaining "${impact.name}" in your routine`,
              impact:
                lang === "es"
                  ? `Tus datos muestran una asociación entre omitirlo y un ánimo más bajo.${disclaimer}`
                  : `Your data shows an association between skipping it and lower mood.${disclaimer}`,
              targetArea: lang === "es" ? "Estado de Ánimo" : "Mood",
              difficulty: "Medium",
            });
          }
        }
      } else if (et.focus && focusDrop >= 0.5 && impact.avgFocusWithout > 0) {
        warnings.push(
          lang === "es"
            ? `Los días sin ${actionNounEs} "${impact.name}" se asocian con menor enfoque (${impact.avgFocusWithout.toFixed(1)} vs ${impact.avgFocusWith.toFixed(1)} con él).${disclaimer}`
            : `Days without ${actionNounEn} "${impact.name}" are associated with lower focus (${impact.avgFocusWithout.toFixed(1)} vs ${impact.avgFocusWith.toFixed(1)} with it).${disclaimer}`
        );
        if (focusDrop >= 0.8) {
          const exists = actionableInsights.some((a) => a.habit.includes(impact.name));
          if (!exists) {
            actionableInsights.push({
              habit:
                lang === "es"
                  ? `Priorizar "${impact.name}" en tu rutina`
                  : `Consider prioritizing "${impact.name}" in your routine`,
              impact:
                lang === "es"
                  ? `Tus datos muestran una asociación entre omitirlo y un menor nivel de enfoque.${disclaimer}`
                  : `Your data shows an association between skipping it and reduced focus.${disclaimer}`,
              targetArea: lang === "es" ? "Enfoque" : "Focus",
              difficulty: "Medium",
            });
          }
        }
      }
    }
  });

  return { actionableInsights, positives, warnings };
}
