export function generateScoringAndSummary(
  lang: "en" | "es",
  avgMood: number,
  avgFocus: number,
  avgSleepDur: number,
  avgSleepQual: number
): { overallSummary: string; wellbeingScore: number } {
  
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

  return { overallSummary, wellbeingScore };
}
