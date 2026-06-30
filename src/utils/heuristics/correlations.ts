import { LogEntry, Correlation, EnabledTrackers } from "../../types";
import { translations } from "../translations";
import { getTotalSleep } from "../helpers";
import {
  pearsonCorrelation,
  pearsonDirection,
  formatPearsonR,
  MIN_SAMPLE_SIZE,
} from "./statistics";

export function generateCorrelations(
  history: LogEntry[],
  lang: "en" | "es",
  et: EnabledTrackers,
  avgMood: number,
  avgFocus: number
): Correlation[] {
  const t = translations[lang];
  const correlations: Correlation[] = [];

  // Require minimum dataset before attempting any correlation
  if (history.length < MIN_SAMPLE_SIZE) {
    return correlations;
  }

  // --- Sleep Duration ↔ Mood (Pearson on continuous values) ---
  if (et.sleep && et.mood) {
    const sleepDurations = history.map((e) => getTotalSleep(e, et));
    const moods = history.map((e) => e.mood);
    const r = pearsonCorrelation(sleepDurations, moods);
    const direction = pearsonDirection(r);
    const rLabel = formatPearsonR(r);

    const descEn =
      direction === "positive"
        ? `Sleep duration shows a positive association with mood (${rLabel}). Longer nights tend to coincide with higher mood scores.`
        : direction === "negative"
        ? `Unexpectedly, longer sleep duration correlates negatively with mood (${rLabel}). This may reflect reverse causality (e.g., resting more when already feeling low).`
        : `Sleep duration and mood show no clear linear relationship in your data (${rLabel}).`;

    const descEs =
      direction === "positive"
        ? `La duración del sueño muestra una asociación positiva con el estado de ánimo (${rLabel}). Las noches más largas tienden a coincidir con un ánimo más alto.`
        : direction === "negative"
        ? `Sorprendentemente, dormir más se asocia negativamente con el ánimo (${rLabel}). Esto puede reflejar causalidad inversa (ej. descansar más cuando ya uno se siente bajo).`
        : `La duración del sueño y el ánimo no muestran una relación lineal clara en tus datos (${rLabel}).`;

    correlations.push({
      categoryA: t.categories.sleepDuration,
      categoryB: t.categories.moodRating,
      direction,
      description: lang === "es" ? descEs : descEn,
    });
  }

  // --- Sleep Quality ↔ Concentration (Pearson on continuous values) ---
  if (et.sleep && et.focus) {
    const sleepQualities = history.map((e) => e.sleepQuality);
    const concentrations = history.map((e) => e.concentration);
    const r = pearsonCorrelation(sleepQualities, concentrations);
    const direction = pearsonDirection(r);
    const rLabel = formatPearsonR(r);

    const descEn =
      direction === "positive"
        ? `Sleep quality is positively associated with concentration (${rLabel}). Higher quality sleep tends to coincide with sharper daily focus.`
        : direction === "negative"
        ? `Sleep quality and concentration show an unexpected negative association (${rLabel}). Consider logging more days to confirm this trend.`
        : `Sleep quality and concentration show no clear linear relationship in your data (${rLabel}).`;

    const descEs =
      direction === "positive"
        ? `La calidad del sueño se asocia positivamente con la concentración (${rLabel}). Noches más restauradoras tienden a coincidir con un enfoque más agudo.`
        : direction === "negative"
        ? `La calidad del sueño y la concentración muestran una asociación negativa inesperada (${rLabel}). Considera registrar más días para confirmar esta tendencia.`
        : `La calidad del sueño y la concentración no muestran una relación lineal clara en tus datos (${rLabel}).`;

    correlations.push({
      categoryA: t.categories.sleepQuality,
      categoryB: t.categories.focusScore,
      direction,
      description: lang === "es" ? descEs : descEn,
    });
  }

  return correlations;
}
