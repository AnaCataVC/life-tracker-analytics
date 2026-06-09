import { ActionableInsight, EnabledTrackers } from "../../types";
import { translations } from "../translations";

export function generateActionableInsights(
  lang: "en" | "es",
  et: EnabledTrackers,
  avgSleepDur: number,
  avgSleepQual: number,
  avgMood: number,
  avgFocus: number,
  individualImpacts: any[]
): { actionableInsights: ActionableInsight[]; positives: string[]; warnings: string[] } {
  const t = translations[lang];
  const actionableInsights: ActionableInsight[] = [];
  const positives: string[] = [];
  const warnings: string[] = [];

  // Sleep Duration advice
  if (et.sleep) {
    if (avgSleepDur < 7.0) {
      if (et.focus) {
        actionableInsights.push({
          habit: lang === "es" ? "Avanzar la hora de dormir 30 minutos" : "Advance bedtime by 30 minutes",
          impact: lang === "es" 
            ? "Tu promedio de sueño actual es de " + avgSleepDur.toFixed(1) + "h. Subirlo al rango objetivo de 7-8h incrementará la claridad."
            : "Your sleep average is " + avgSleepDur.toFixed(1) + "h. Moving into the 7-8h target zone will eliminate brain fog.",
          targetArea: lang === "es" ? "Sueño y Enfoque" : "Sleep & Focus",
          difficulty: "Easy"
        });
      }
      warnings.push(
        lang === "es"
          ? `Consumo de horas de sueño recortado (promedio de ${avgSleepDur.toFixed(1)} horas), lo que limita el rendimiento.`
          : `Restricted sleep window logged (averaging ${avgSleepDur.toFixed(1)} hours), leading to stamina decay.`
      );
    } else {
      positives.push(
        lang === "es"
          ? `¡Estupendo! Promedio de sueño óptimo de ${avgSleepDur.toFixed(1)} horas por noche.`
          : `Great work maintaining an average sleep of ${avgSleepDur.toFixed(1)} hours.`
      );
    }

    // Sleep Quality advice
    if (avgSleepQual < 6.5) {
      actionableInsights.push({
        habit: lang === "es" ? "Limitar pantallas 1 hora antes de dormir" : "Restrict digital screens 1 hour before sleep",
        impact: lang === "es" 
          ? "Mejora la calidad subjetiva de descanso, que actualmente es un poco baja (" + avgSleepQual.toFixed(1) + "/10)."
          : "Elevates rest deepness, which is currently slightly low at " + avgSleepQual.toFixed(1) + "/10.",
        targetArea: lang === "es" ? "Calidad de Sueño" : "Sleep Quality",
        difficulty: "Medium"
      });
      warnings.push(
        lang === "es"
          ? `Registros muestran noches con sueño fragmentado (calidad de ${avgSleepQual.toFixed(1)}/10).`
          : `Frequent restless nights detected (quality average ${avgSleepQual.toFixed(1)}/10).`
      );
    } else {
      positives.push(
        lang === "es"
          ? "Calidad de sueño promedio muy sana e íntegra."
          : "Sound sleep architecture with a healthy quality baseline."
      );
    }
  }

  // Fallback actionable insights if list is short
  if (actionableInsights.length === 0 && et.mood) {
    actionableInsights.push({
      habit: lang === "es" ? "Añadir un diario de gratitud de una línea" : "Incorporate a 1-line gratitude entry",
      impact: lang === "es" ? "Consolida las ráfagas de humor sobresalientes" : "Anchors outstanding days to protect long-term mood.",
      targetArea: lang === "es" ? "Estado de Ánimo" : "Mood",
      difficulty: "Easy"
    });
  }

  // Generate text insights based on individual habit/medication impacts
  individualImpacts.forEach(impact => {
    const missedDays = impact.daysPresent - impact.daysCompleted;
    const actionVerbEs = impact.type === "medication" ? "tomar" : "cumplir";
    const actionVerbEn = impact.type === "medication" ? "take" : "complete";
    const actionVerbEsCapital = impact.type === "medication" ? "Tomar" : "Cumplir";
    const actionVerbEnCapital = impact.type === "medication" ? "Taking" : "Completing";
    const actionVerbEnIng = impact.type === "medication" ? "taking" : "completing";

    if (missedDays >= 1) { 
      // "Doing X helps Y"
      if (et.mood && impact.moodDifference >= 0.5) {
        positives.push(
          lang === "es"
            ? `${actionVerbEsCapital} "${impact.name}" te ayuda: eleva tu ánimo en +${impact.moodDifference.toFixed(1)} puntos (vs no hacerlo).`
            : `${actionVerbEnCapital} "${impact.name}" helps: boosts your mood by +${impact.moodDifference.toFixed(1)} points (vs skipping).`
        );
      } else if (et.focus && impact.focusDifference >= 0.5) {
        positives.push(
          lang === "es"
            ? `${actionVerbEsCapital} "${impact.name}" te ayuda: mejora tu enfoque en +${impact.focusDifference.toFixed(1)} puntos.`
            : `${actionVerbEnCapital} "${impact.name}" helps: improves your focus by +${impact.focusDifference.toFixed(1)} points.`
        );
      }

      // "Not doing Z harms Y" (comparing missed days against the user's general baseline)
      const moodDrop = avgMood - impact.avgMoodWithout;
      const focusDrop = avgFocus - impact.avgFocusWithout;

      if (et.mood && moodDrop >= 0.5 && impact.avgMoodWithout > 0) {
        warnings.push(
          lang === "es"
            ? `No ${actionVerbEs} "${impact.name}" te perjudica: tu estado de ánimo cae a ${impact.avgMoodWithout.toFixed(1)} (promedio base: ${avgMood.toFixed(1)}).`
            : `Not ${actionVerbEnIng} "${impact.name}" harms you: your mood drops to ${impact.avgMoodWithout.toFixed(1)} (baseline: ${avgMood.toFixed(1)}).`
        );
        if (moodDrop >= 0.8) {
          const exists = actionableInsights.some(a => a.habit.includes(impact.name));
          if (!exists) {
            actionableInsights.push({
              habit: lang === "es" ? `No omitir "${impact.name}"` : `Do not skip "${impact.name}"`,
              impact: lang === "es"
                ? `Los datos indican que no ${actionVerbEs}lo penaliza tu estado de ánimo considerablemente.`
                : `Data indicates that failing to ${actionVerbEn} it significantly penalizes your mood.`,
              targetArea: lang === "es" ? "Estado de Ánimo" : "Mood",
              difficulty: "Medium"
            });
          }
        }
      } else if (et.focus && focusDrop >= 0.5 && impact.avgFocusWithout > 0) {
        warnings.push(
          lang === "es"
            ? `No ${actionVerbEs} "${impact.name}" afecta tu enfoque: cae a ${impact.avgFocusWithout.toFixed(1)} en esos días.`
            : `Not ${actionVerbEnIng} "${impact.name}" affects your focus: it drops to ${impact.avgFocusWithout.toFixed(1)} on those days.`
        );
        if (focusDrop >= 0.8) {
          const exists = actionableInsights.some(a => a.habit.includes(impact.name));
          if (!exists) {
            actionableInsights.push({
              habit: lang === "es" ? `Priorizar "${impact.name}"` : `Prioritize "${impact.name}"`,
              impact: lang === "es"
                ? `Evita saltarlo, ya que no ${actionVerbEs}lo perjudica sustancialmente tu concentración.`
                : `Avoid skipping it, as failing to ${actionVerbEn} it substantially harms your concentration.`,
              targetArea: lang === "es" ? "Enfoque" : "Focus",
              difficulty: "Medium"
            });
          }
        }
      }
    }
  });

  return { actionableInsights, positives, warnings };
}
