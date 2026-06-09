import { LogEntry, Correlation, EnabledTrackers } from "../../types";
import { translations } from "../translations";
import { getTotalSleep } from "../helpers";

export function generateCorrelations(
  history: LogEntry[],
  lang: "en" | "es",
  et: EnabledTrackers,
  avgMood: number,
  avgFocus: number
): Correlation[] {
  const t = translations[lang];
  const correlations: Correlation[] = [];

  const highSleepDays = history.filter((e) => getTotalSleep(e, et) >= 7.5);
  const lowSleepDays = history.filter((e) => getTotalSleep(e, et) < 7.5);
  const avgMoodOnHighSleep = highSleepDays.length > 0 
    ? highSleepDays.reduce((sum, e) => sum + e.mood, 0) / highSleepDays.length 
    : avgMood;
  const avgMoodOnLowSleep = lowSleepDays.length > 0
    ? lowSleepDays.reduce((sum, e) => sum + e.mood, 0) / lowSleepDays.length
    : avgMood;

  const highSleepQualDays = history.filter((e) => e.sleepQuality >= 7);
  const lowSleepQualDays = history.filter((e) => e.sleepQuality < 7);
  const avgFocusOnHighSleepCard = highSleepQualDays.length > 0
    ? highSleepQualDays.reduce((sum, e) => sum + e.concentration, 0) / highSleepQualDays.length
    : avgFocus;
  const avgFocusOnLowSleepCard = lowSleepQualDays.length > 0
    ? lowSleepQualDays.reduce((sum, e) => sum + e.concentration, 0) / lowSleepQualDays.length
    : avgFocus;

  // Sleep Duration -> Mood
  if (et.sleep && et.mood) {
    if (highSleepDays.length > 0 && lowSleepDays.length > 0) {
      const diff = avgMoodOnHighSleep - avgMoodOnLowSleep;
      const direction = diff > 0.3 ? "positive" : diff < -0.3 ? "negative" : "neutral";
      const descEn = direction === "positive"
        ? `Sleeping 7.5+ hours improves your mood rating by +${diff.toFixed(1)} points compared to shorter nights (averaging ${avgMoodOnHighSleep.toFixed(1)}/10 vs ${avgMoodOnLowSleep.toFixed(1)}/10).`
        : direction === "negative"
        ? `Longer sleep duration unexpectedly correlates with lower mood by ${Math.abs(diff).toFixed(1)} points.`
        : `Mood level stays stable regardless of sleep duration (around ${avgMood.toFixed(1)}/10).`;
      const descEs = direction === "positive"
        ? `Dormir más de 7.5 horas mejora tu estado de ánimo en +${diff.toFixed(1)} puntos en comparación con noches más cortas (${avgMoodOnHighSleep.toFixed(1)}/10 vs ${avgMoodOnLowSleep.toFixed(1)}/10).`
        : direction === "negative"
        ? `Las horas extra de sueño se relacionan con un menor estado de ánimo en ${Math.abs(diff).toFixed(1)} puntos.`
        : `El estado de ánimo permanece uniforme independientemente de las horas de sueño (alrededor de ${avgMood.toFixed(1)}/10).`;

      correlations.push({
        categoryA: t.categories.sleepDuration,
        categoryB: t.categories.moodRating,
        direction,
        description: lang === "es" ? descEs : descEn
      });
    } else {
      correlations.push({
        categoryA: t.categories.sleepDuration,
        categoryB: t.categories.moodRating,
        direction: "neutral",
        description: lang === "es" 
          ? "Registra variaciones en la duración de sueño para evaluar su efecto estadístico sobre tu humor."
          : "Log sleep variations to calculate its statistical impact on your mood."
      });
    }
  }

  // Sleep Quality -> Concentration
  if (et.sleep && et.focus) {
    if (highSleepQualDays.length > 0 && lowSleepQualDays.length > 0) {
      const diff = avgFocusOnHighSleepCard - avgFocusOnLowSleepCard;
      const direction = diff > 0.3 ? "positive" : diff < -0.3 ? "negative" : "neutral";
      const descEn = direction === "positive"
        ? `Sound sleep quality (rating >=7) enhances your sharpness, raising your concentration average by +${diff.toFixed(1)} points.`
        : `Sleep quality variations show a minor impact of ${diff.toFixed(1)} points on your daily concentration levels.`;
      const descEs = direction === "positive"
        ? `La buena calidad de sueño (puntuación >=7) potencia tu agudeza mental, elevando tu enfoque en +${diff.toFixed(1)} puntos.`
        : `Las variaciones en calidad del sueño muestran un impacto menor de ${diff.toFixed(1)} puntos en tu concentración diaria.`;

      correlations.push({
        categoryA: t.categories.sleepQuality,
        categoryB: t.categories.focusScore,
        direction,
        description: lang === "es" ? descEs : descEn
      });
    } else {
      correlations.push({
        categoryA: t.categories.sleepQuality,
        categoryB: t.categories.focusScore,
        direction: "neutral",
        description: lang === "es"
          ? "Un sueño óptimo (>7 puntos) suele acelerar el flujo de concentración. Añade más registros para confirmar la correlación."
          : "High sleep quality (>7) usually boosts cognitive speed. Keep logging to confirm this correlation."
      });
    }
  }

  return correlations;
}
