import { LogEntry, WellBeingInsights, Correlation, ActionableInsight, EnabledTrackers } from "../types";
import { translations } from "./translations";
import { getTotalSleep } from "./helpers";

/**
 * Calculates offline statistical insights from log history without any AI API calls.
 */
export function calculateLocalInsights(
  history: LogEntry[],
  lang: "en" | "es",
  enabledTrackers?: EnabledTrackers
): WellBeingInsights {
  const t = translations[lang];

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

  // Task compliance & medication averages are no longer grouped.
  // Each task/med is evaluated individually.

  // Let's compute actual statistical groupings
  // 1. Sleep Duration influence on Mood
  const highSleepDays = history.filter((e) => getTotalSleep(e, et) >= 7.5);
  const lowSleepDays = history.filter((e) => getTotalSleep(e, et) < 7.5);
  const avgMoodOnHighSleep = highSleepDays.length > 0 
    ? highSleepDays.reduce((sum, e) => sum + e.mood, 0) / highSleepDays.length 
    : avgMood;
  const avgMoodOnLowSleep = lowSleepDays.length > 0
    ? lowSleepDays.reduce((sum, e) => sum + e.mood, 0) / lowSleepDays.length
    : avgMood;

  // 2. Sleep Quality influence on Focus
  const highSleepQualDays = history.filter((e) => e.sleepQuality >= 7);
  const lowSleepQualDays = history.filter((e) => e.sleepQuality < 7);
  const avgFocusOnHighSleepCard = highSleepQualDays.length > 0
    ? highSleepQualDays.reduce((sum, e) => sum + e.concentration, 0) / highSleepQualDays.length
    : avgFocus;
  const avgFocusOnLowSleepCard = lowSleepQualDays.length > 0
    ? lowSleepQualDays.reduce((sum, e) => sum + e.concentration, 0) / lowSleepQualDays.length
    : avgFocus;



  // Generate quantitative correlations
  const correlations: Correlation[] = [];

  // Sleep sleepQuality -> Mood
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



  // Generate actionable habits mathematically
  const actionableInsights: ActionableInsight[] = [];
  const positives: string[] = [];
  const warnings: string[] = [];

  // Sleep sleepQuality advice
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

  let overallSummary = "";
  if (lang === "es") {
    overallSummary = `Tus registros indican un estado de ánimo base de ${avgMood.toFixed(1)}/10 y un nivel de enfoque promedio de ${avgFocus.toFixed(1)}/10. `;
    if (avgSleepDur >= 7.5 && avgSleepQual >= 7) {
      overallSummary += `Tu descanso es sumamente reparador y consistente (sueño promedio de ${avgSleepDur.toFixed(1)}h con calidad de ${avgSleepQual.toFixed(1)}/10). Esto consolida tus facultades intelectuales diarias. `;
    } else {
      overallSummary += `Hay oportunidades para mejorar la regularidad de tu descanso. Ajustar la hora de ir a la cama podría reducir la fatiga diurna notablemente. `;
    }
  } else {
    overallSummary = `Your tracked data indicates an average daily mood of ${avgMood.toFixed(1)}/10 and a concentration level of ${avgFocus.toFixed(1)}/10. `;
    if (avgSleepDur >= 7.5 && avgSleepQual >= 7) {
      overallSummary += `Your sleep architecture looks strong and highly restorative (averaging ${avgSleepDur.toFixed(1)}h sleeping with a quality score of ${avgSleepQual.toFixed(1)}/10), which anchors clean daily clarity. `;
    } else {
      overallSummary += `Data suggests adjustments to your sleep duration or bedtime regularities will trigger beneficial cascades in daylight focus. `;
    }
  }

  // Calculate high quality dynamic well-being score from 1 to 100
  // Weight: Mood (50%), Sleep Quality + Duration ratio (50%)
  const sleepDurScore = Math.min((avgSleepDur / 8) * 100, 100);
  const sleepQualScore = (avgSleepQual / 10) * 100;
  const moodScore = (avgMood / 10) * 100;

  const rawScore = 
    (moodScore * 0.5) + 
    (((sleepDurScore + sleepQualScore) / 2) * 0.5);

  const wellbeingScore = Math.max(1, Math.min(100, Math.round(rawScore)));

  // Calculate deep individual factor relationships (not just summing/counting compliance)
  // 1. Gather all unique habit names
  const allHabitNames = new Set<string>();
  history.forEach(entry => {
    entry.tasks?.forEach(t => {
      if (t.name) allHabitNames.add(t.name.trim());
    });
  });

  // 2. Gather all unique medication names + dosage
  const allMedicationKeys = new Map<string, string>(); // name.lowercase() -> dosage
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

  // 3. Calculate impact for each unique habit
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

  // 4. Calculate impact for each unique medication
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
