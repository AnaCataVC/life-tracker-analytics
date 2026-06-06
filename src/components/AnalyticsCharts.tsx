import React, { useState, useMemo, useEffect } from "react";
import { LogEntry, EnabledTrackers } from "../types";
import { translations } from "../utils/translations";
import { calculateLocalInsights } from "../utils/analysisEngine";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, 
  Info, 
  Moon, 
  Smile, 
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CheckSquare,
  Activity,
  Pill,
  Check,
  BarChart2
} from "lucide-react";

interface AnalyticsChartsProps {
  history: LogEntry[];
  lang: "en" | "es";
  mode?: "stats" | "correlations" | "all";
  theme?: "light" | "dark";
  enabledTrackers: EnabledTrackers;
}

export default function AnalyticsCharts({ history, lang, mode = "all", theme = "light", enabledTrackers }: AnalyticsChartsProps) {
  const t = translations[lang];

  // Options for chart correlation types
  const [chartType, setChartType] = useState<string>("mood-sleep");

  // Extract all unique habit names from history for precise individual tracking
  const uniqueHabits = useMemo(() => {
    const habitsSet = new Set<string>();
    history.forEach((entry) => {
      entry.tasks?.forEach((t) => {
        if (t.name) habitsSet.add(t.name.trim());
      });
    });
    return Array.from(habitsSet);
  }, [history]);

  // Extract all unique medication names from history for precise individual tracking
  const uniqueMeds = useMemo(() => {
    const medsSet = new Set<string>();
    history.forEach((entry) => {
      entry.medications?.forEach((m) => {
        if (m.name) medsSet.add(m.name.trim());
      });
    });
    return Array.from(medsSet);
  }, [history]);

  const [selectedHabit, setSelectedHabit] = useState<string>("");
  const [selectedMed, setSelectedMed] = useState<string>("");
  const [targetMetric, setTargetMetric] = useState<"mood" | "concentration" | "sleepDuration" | "sleepQuality">("mood");

  // Heatmap and insights state
  const [activeHeatmapMetric, setActiveHeatmapMetric] = useState<"mood" | "sleep" | "focus">("mood");

  useEffect(() => {
    // Sync chartType
    let isValidChart = false;
    if (chartType === "mood-sleep" && enabledTrackers.mood && enabledTrackers.sleep) isValidChart = true;
    if (chartType === "concentration-sleep" && enabledTrackers.focus && enabledTrackers.sleep) isValidChart = true;
    if (chartType === "tasks-specific" && enabledTrackers.tasks) isValidChart = true;
    if (chartType === "meds-specific" && enabledTrackers.medications) isValidChart = true;

    if (!isValidChart) {
      if (enabledTrackers.mood && enabledTrackers.sleep) setChartType("mood-sleep");
      else if (enabledTrackers.focus && enabledTrackers.sleep) setChartType("concentration-sleep");
      else if (enabledTrackers.tasks) setChartType("tasks-specific");
      else if (enabledTrackers.medications) setChartType("meds-specific");
      else setChartType("");
    }

    // Sync targetMetric
    let isValidTarget = false;
    if (targetMetric === "mood" && enabledTrackers.mood) isValidTarget = true;
    if (targetMetric === "concentration" && enabledTrackers.focus) isValidTarget = true;
    if ((targetMetric === "sleepDuration" || targetMetric === "sleepQuality") && enabledTrackers.sleep) isValidTarget = true;

    if (!isValidTarget) {
      if (enabledTrackers.mood) setTargetMetric("mood");
      else if (enabledTrackers.focus) setTargetMetric("concentration");
      else if (enabledTrackers.sleep) setTargetMetric("sleepQuality");
    }

    // Sync activeHeatmapMetric
    let isValidHeatmap = false;
    if (activeHeatmapMetric === "mood" && enabledTrackers.mood) isValidHeatmap = true;
    if (activeHeatmapMetric === "sleep" && enabledTrackers.sleep) isValidHeatmap = true;
    if (activeHeatmapMetric === "focus" && enabledTrackers.focus) isValidHeatmap = true;

    if (!isValidHeatmap) {
      if (enabledTrackers.mood) setActiveHeatmapMetric("mood");
      else if (enabledTrackers.sleep) setActiveHeatmapMetric("sleep");
      else if (enabledTrackers.focus) setActiveHeatmapMetric("focus");
    }
  }, [enabledTrackers, chartType, targetMetric, activeHeatmapMetric]);

  useEffect(() => {
    if (uniqueHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(uniqueHabits[0]);
    }
  }, [uniqueHabits, selectedHabit]);

  useEffect(() => {
    if (uniqueMeds.length > 0 && !selectedMed) {
      setSelectedMed(uniqueMeds[0]);
    }
  }, [uniqueMeds, selectedMed]);

  // State for Heatmap display month and year
  const getInitialMonthAndYear = () => {
    if (history && history.length > 0) {
      const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestDateStr = sorted[0].date; // "YYYY-MM-DD"
      const parts = latestDateStr.split("-");
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1 // 0-indexed
        };
      }
    }
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth()
    };
  };

  const initial = getInitialMonthAndYear();
  const [viewYear, setViewYear] = useState<number>(initial.year);
  const [viewMonth, setViewMonth] = useState<number>(initial.month);
  const [selectedDayLog, setSelectedDayLog] = useState<LogEntry | null>(null);

  const localInsights = useMemo(() => calculateLocalInsights(history, lang, enabledTrackers), [history, lang, enabledTrackers]);
  const highestImpactFactor = useMemo(() => {
    if (!localInsights.individualImpacts || localInsights.individualImpacts.length === 0) return null;
    let topFactor = localInsights.individualImpacts[0];
    let topVal = -999;
    localInsights.individualImpacts.forEach(factor => {
      const val = Math.max(factor.moodDifference, factor.focusDifference);
      if (val > topVal) {
        topVal = val;
        topFactor = factor;
      }
    });
    return topVal > 0.15 ? topFactor : null;
  }, [localInsights]);

  // Format historical logs for visual chart mapping
  const chartData = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => {

      // Check if selected habit was completed on this day (10 if completed, 0 if not completed/not present)
      const habitLower = selectedHabit ? selectedHabit.toLowerCase() : "";
      const habitItem = entry.tasks?.find(t => t.name.trim().toLowerCase() === habitLower);
      const specificHabitScore = habitItem ? (habitItem.completed ? 10 : 0) : 0;

      // Check if selected medication was taken on this day (10 if taken, 0 if not taken)
      const medLower = selectedMed ? selectedMed.toLowerCase() : "";
      const medItem = entry.medications?.find(m => m.name.trim().toLowerCase() === medLower);
      const specificMedScore = medItem ? (medItem.taken ? 10 : 0) : 0;

      // Format date for display: e.g. "May 20" or "20 may."
      let formattedDate = entry.date;
      try {
        const d = new Date(entry.date + "T00:00:00");
        formattedDate = d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" });
      } catch (e) {
        // Fallback
      }

      return {
        date: entry.date,
        displayDate: formattedDate,
        mood: entry.mood,
        sleepQuality: entry.sleepQuality,
        sleepDuration: entry.sleepDuration,
        concentration: entry.concentration,
        specificHabitScore,
        specificMedScore
      };
    });

  // Calculate descriptive statistics to make correlations visual
  const avgMood = history.length > 0 ? (history.reduce((sum, e) => sum + e.mood, 0) / history.length).toFixed(1) : "0.0";
  const avgSleep = history.length > 0 ? (history.reduce((sum, e) => sum + (e.sleepDuration || 0), 0) / history.length).toFixed(1) : "0.0";
  const avgFocus = history.length > 0 ? (history.reduce((sum, e) => sum + e.concentration, 0) / history.length).toFixed(1) : "0.0";

  // Calculate weekly statistics (last 7 logged days)
  const last7DaysLogs = [...history]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const last7AvgMood = last7DaysLogs.length > 0
    ? Number((last7DaysLogs.reduce((sum, e) => sum + e.mood, 0) / last7DaysLogs.length).toFixed(1))
    : 0;

  const last7AvgSleepQuality = last7DaysLogs.length > 0
    ? Number((last7DaysLogs.reduce((sum, e) => sum + e.sleepQuality, 0) / last7DaysLogs.length).toFixed(1))
    : 0;


  // Let's also calculate all time baselines for comparison
  const baselineMood = history.length > 0
    ? Number((history.reduce((sum, e) => sum + e.mood, 0) / history.length).toFixed(1))
    : 0;

  const baselineSleepQuality = history.length > 0
    ? Number((history.reduce((sum, e) => sum + e.sleepQuality, 0) / history.length).toFixed(1))
    : 0;


  // Days of week definitions for analytics bar charts
  const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesEs = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fullDayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const fullDayNamesEs = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const metricByDay = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    name: lang === "es" ? dayNamesEs[i] : dayNamesEn[i],
    fullName: lang === "es" ? fullDayNamesEs[i] : fullDayNamesEn[i],
    moodSum: 0,
    moodCount: 0,
    sleepSum: 0,
    sleepCount: 0,
    focusSum: 0,
    focusCount: 0,
  }));

  history.forEach((entry) => {
    try {
      const d = new Date(entry.date + "T00:00:00");
      const dayIndex = d.getDay();
      if (dayIndex >= 0 && dayIndex < 7) {
        metricByDay[dayIndex].moodSum += entry.mood;
        metricByDay[dayIndex].moodCount += 1;
        metricByDay[dayIndex].sleepSum += entry.sleepQuality;
        metricByDay[dayIndex].sleepCount += 1;
        metricByDay[dayIndex].focusSum += entry.concentration;
        metricByDay[dayIndex].focusCount += 1;
      }
    } catch (e) {
      // ignore
    }
  });

  const dayOfWeekData = metricByDay.map((item) => {
    const avgMood = item.moodCount > 0 ? Number((item.moodSum / item.moodCount).toFixed(1)) : 0;
    const avgSleep = item.sleepCount > 0 ? Number((item.sleepSum / item.sleepCount).toFixed(1)) : 0;
    const avgFocus = item.focusCount > 0 ? Number((item.focusSum / item.focusCount).toFixed(1)) : 0;
    
    const avgMetric = activeHeatmapMetric === "sleep" ? avgSleep : activeHeatmapMetric === "focus" ? avgFocus : avgMood;
    const count = activeHeatmapMetric === "sleep" ? item.sleepCount : activeHeatmapMetric === "focus" ? item.focusCount : item.moodCount;

    return {
      name: item.name,
      fullName: item.fullName,
      avgMetric,
      avgMood, // kept for backwards compatibility in other parts of the file if needed
      count,
    };
  });

  // Reorder days so the week starts on Monday for display order
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const orderedDayOfWeekData = weekdayOrder.map((dayIndex) => dayOfWeekData[dayIndex]);

  const daysWithData = orderedDayOfWeekData.filter(d => d.count > 0);
  let bestDay: any = null;
  let toughestDay: any = null;

  if (daysWithData.length > 0) {
    bestDay = [...daysWithData].sort((a, b) => b.avgMetric - a.avgMetric)[0];
    toughestDay = [...daysWithData].sort((a, b) => a.avgMetric - b.avgMetric)[0];
  }

  // Weekday vs Weekend Comparison averages
  let weekdaySum = 0;
  let weekdayCount = 0;
  let weekendSum = 0;
  let weekendCount = 0;

  history.forEach((entry) => {
    try {
      const d = new Date(entry.date + "T00:00:00");
      const day = d.getDay();
      
      const val = activeHeatmapMetric === "sleep" ? entry.sleepQuality 
                : activeHeatmapMetric === "focus" ? entry.concentration 
                : entry.mood;

      if (day === 0 || day === 6) { // Sun, Sat
        weekendSum += val;
        weekendCount += 1;
      } else {
        weekdaySum += val;
        weekdayCount += 1;
      }
    } catch (e) {}
  });

  const avgWeekdayMetric = weekdayCount > 0 ? weekdaySum / weekdayCount : 0;
  const avgWeekendMetric = weekendCount > 0 ? weekendSum / weekendCount : 0;

  const getInsightNarrative = () => {
    if (daysWithData.length < 2) {
      return lang === "es"
        ? "Registra al menos 2 días de la semana distintos para comparar patrones."
        : "Log entries on at least 2 different days of the week to compare pattern averages.";
    }

    const diff = Math.abs(avgWeekendMetric - avgWeekdayMetric).toFixed(1);
    let comparisonText = "";
    
    const metricNameEs = activeHeatmapMetric === "sleep" ? "calidad de sueño" : activeHeatmapMetric === "focus" ? "nivel de enfoque" : "ánimo";
    const metricNameEn = activeHeatmapMetric === "sleep" ? "sleep quality" : activeHeatmapMetric === "focus" ? "focus level" : "mood";

    if (weekendCount > 0 && weekdayCount > 0) {
      if (avgWeekendMetric > avgWeekdayMetric) {
        comparisonText = lang === "es"
          ? `Tu ${metricNameEs} suele ser mayor el fin de semana por una diferencia de +${diff} puntos.`
          : `Your ${metricNameEn} is typically higher on weekends by +${diff} points.`;
      } else if (avgWeekdayMetric > avgWeekendMetric) {
        comparisonText = lang === "es"
          ? `Tu ${metricNameEs} suele ser mayor durante los días laborables por una diferencia de +${diff} puntos.`
          : `Your ${metricNameEn} is typically higher on weekdays by +${diff} points.`;
      } else {
        comparisonText = lang === "es"
          ? `Tu ${metricNameEs} promedio es perfectamente uniforme entre los días laborables y el fin de semana.`
          : `Your average ${metricNameEn} is exceptionally stable between weekdays and weekends.`;
      }
    } else {
      comparisonText = lang === "es"
        ? "Registra tanto días hábiles como fines de semana para habilitar el balance."
        : "Log both labor days and weekend entries to unlock balance insights.";
    }

    return comparisonText;
  };

  // Compute a simple insight correlation value based on correlation select
  const getCorrelationStatusText = () => {
    if (history.length < 3) return t.trendsDescription.insufficient;
    
    const localInsights = calculateLocalInsights(history, lang, enabledTrackers);

    switch (chartType) {
      case "mood-sleep":
        return t.trendsDescription.moodSleep
          .replace("{mood}", avgMood.toString())
          .replace("{sleep}", avgSleep.toString());
      case "concentration-sleep":
        return t.trendsDescription.focusSleep
          .replace("{focus}", avgFocus.toString());
      case "tasks-specific": {
        if (!selectedHabit) {
          return lang === "es"
            ? "Selecciona un hábito específico del menú para contrastar su ocurrencia contra tu métrica elegida."
            : "Select a specific habit from the menu to map its completion against your chosen metric.";
        }
        const itemImpact = localInsights.individualImpacts?.find(
          f => f.type === "habit" && f.name.toLowerCase() === selectedHabit.toLowerCase()
        );
        if (itemImpact) {
          const diff = targetMetric === "mood" ? itemImpact.moodDifference 
            : targetMetric === "concentration" ? itemImpact.focusDifference
            : targetMetric === "sleepDuration" ? itemImpact.sleepDurDifference
            : itemImpact.sleepQualDifference;
            
          const avgWith = targetMetric === "mood" ? itemImpact.avgMoodWith 
            : targetMetric === "concentration" ? itemImpact.avgFocusWith
            : targetMetric === "sleepDuration" ? itemImpact.avgSleepDurWith
            : itemImpact.avgSleepQualWith;
            
          const avgWithout = targetMetric === "mood" ? itemImpact.avgMoodWithout 
            : targetMetric === "concentration" ? itemImpact.avgFocusWithout
            : targetMetric === "sleepDuration" ? itemImpact.avgSleepDurWithout
            : itemImpact.avgSleepQualWithout;

          if (diff > 0.1) {
            return lang === "es"
              ? `Análisis de Hábito: Realizar "${selectedHabit}" se asocia con un aumento de +${diff.toFixed(1)} en tu métrica promedio (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} cuando no se realiza).`
              : `Habit Analysis: Completing "${selectedHabit}" correlates with a +${diff.toFixed(1)} increase in your average metric (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} when not completed).`;
          } else if (diff < -0.1) {
            return lang === "es"
              ? `Análisis de Hábito: Realizar "${selectedHabit}" se asocia con una disminución de ${Math.abs(diff).toFixed(1)} en tu métrica (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)}).`
              : `Habit Analysis: Completing "${selectedHabit}" correlates with a drop of ${Math.abs(diff).toFixed(1)} in your average metric (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)}).`;
          } else {
            return lang === "es"
              ? `Análisis de Hábito: Tu métrica permanece estable (diferencia de ${diff.toFixed(1)}) se realice o no "${selectedHabit}".`
              : `Habit Analysis: Your baseline stays relatively stable (difference of ${diff.toFixed(1)}) whether completing "${selectedHabit}" or not.`;
          }
        }
        return lang === "es"
          ? `Visualizando el impacto de "${selectedHabit}".`
          : `Visualizing the impact of completing "${selectedHabit}".`;
      }
      case "meds-specific": {
        if (!selectedMed) {
          return lang === "es"
            ? "Selecciona un medicamento del menú para contrastar su ingesta contra tu métrica elegida."
            : "Select a specific medicine from the menu to map its intake against your chosen metric.";
        }
        const itemImpact = localInsights.individualImpacts?.find(
          f => f.type === "medication" && f.name.toLowerCase() === selectedMed.toLowerCase()
        );
        if (itemImpact) {
          const diff = targetMetric === "mood" ? itemImpact.moodDifference 
            : targetMetric === "concentration" ? itemImpact.focusDifference
            : targetMetric === "sleepDuration" ? itemImpact.sleepDurDifference
            : itemImpact.sleepQualDifference;
            
          const avgWith = targetMetric === "mood" ? itemImpact.avgMoodWith 
            : targetMetric === "concentration" ? itemImpact.avgFocusWith
            : targetMetric === "sleepDuration" ? itemImpact.avgSleepDurWith
            : itemImpact.avgSleepQualWith;
            
          const avgWithout = targetMetric === "mood" ? itemImpact.avgMoodWithout 
            : targetMetric === "concentration" ? itemImpact.avgFocusWithout
            : targetMetric === "sleepDuration" ? itemImpact.avgSleepDurWithout
            : itemImpact.avgSleepQualWithout;

          if (diff > 0.1) {
            return lang === "es"
              ? `Análisis de Medicamento: Tomar "${selectedMed}" se asocia con un aumento de +${diff.toFixed(1)} en tu métrica promediada (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} en días omitidos).`
              : `Medication Analysis: Taking "${selectedMed}" correlates with a +${diff.toFixed(1)} surge in your metric (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)} on omitted days).`;
          } else if (diff < -0.1) {
            return lang === "es"
              ? `Análisis de Medicamento: Tomar "${selectedMed}" se asocia con un promedio menor en ${Math.abs(diff).toFixed(1)} puntos (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)}).`
              : `Medication Analysis: Taking "${selectedMed}" unexpectedly correlates with a minor decrease of ${Math.abs(diff).toFixed(1)} points (${avgWith.toFixed(1)} vs ${avgWithout.toFixed(1)}).`;
          } else {
            return lang === "es"
              ? `Análisis de Medicamento: Tu nivel permanece relativamente estable (diferencia de ${diff.toFixed(1)}) con la toma de "${selectedMed}".`
              : `Medication Analysis: Your levels remain stable (difference of ${diff.toFixed(1)}) with the intake of "${selectedMed}".`;
          }
        }
        return lang === "es"
          ? `Visualizando el impacto individual del medicamento "${selectedMed}".`
          : `Visualizing the direct individual impact of taking "${selectedMed}".`;
      }
      default:
        return lang === "es" 
          ? "El análisis resalta patrones clave que puedes modificar." 
          : "Visual correlation highlights patterns you can modify.";
    }
  };

  return (
    <div id="analytics-panel" className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 flex flex-col xl:grid xl:grid-cols-2 gap-6 animate-fade-in">
      {(mode === "all" || mode === "correlations") && (
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Header and selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 id="analytics-title" className="font-sans font-semibold text-lg text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
            {t.chartTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            {t.chartSubtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2">
          <select
            id="chart-type-selector"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-sans text-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
          >
            {enabledTrackers.mood && enabledTrackers.sleep && <option value="mood-sleep">{t.options.moodSleep}</option>}
            {enabledTrackers.focus && enabledTrackers.sleep && <option value="concentration-sleep">{t.options.focusSleep}</option>}
            {enabledTrackers.tasks && (
              <option value="tasks-specific">
                {lang === "es" ? "Impacto de Hábito Específico" : "Specific Habit Impact"}
              </option>
            )}
            {enabledTrackers.medications && (
              <option value="meds-specific">
                {lang === "es" ? "Impacto de Medicamento" : "Specific Med Impact"}
              </option>
            )}
            {!enabledTrackers.mood && !enabledTrackers.sleep && !enabledTrackers.focus && !enabledTrackers.tasks && !enabledTrackers.medications && (
              <option value="">{lang === "es" ? "Sin datos" : "No data"}</option>
            )}
          </select>

          {/* Sub-selector for Specific Habit */}
          {chartType === "tasks-specific" && (
            uniqueHabits.length > 0 ? (
              <select
                value={selectedHabit}
                onChange={(e) => setSelectedHabit(e.target.value)}
                className="w-full sm:w-auto bg-indigo-50 border border-indigo-100 text-xs font-sans text-indigo-700 px-3 py-2 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
              >
                {uniqueHabits.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            ) : (
              <span className="w-full sm:w-auto text-[10px] text-amber-600 font-medium italic bg-amber-50 px-3 py-2 border border-amber-200 rounded-lg text-center sm:text-left flex items-center justify-center sm:justify-start">
                {lang === "es" ? "No hay hábitos registrados" : "No habits compiled yet"}
              </span>
            )
          )}

          {/* Sub-selector for Specific Medicine */}
          {chartType === "meds-specific" && (
            uniqueMeds.length > 0 ? (
              <select
                value={selectedMed}
                onChange={(e) => setSelectedMed(e.target.value)}
                className="w-full sm:w-auto bg-rose-50 border border-rose-100 text-xs font-sans text-rose-700 px-3 py-2 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-100 focus:border-rose-500 cursor-pointer"
              >
                {uniqueMeds.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <span className="w-full sm:w-auto text-[10px] text-amber-600 font-medium italic bg-amber-50 px-3 py-2 border border-amber-200 rounded-lg text-center sm:text-left flex items-center justify-center sm:justify-start">
                {lang === "es" ? "No hay medicinas registradas" : "No meds compiled yet"}
              </span>
            )
          )}

          {/* Target Metric Selector for specific charts */}
          {(chartType === "tasks-specific" || chartType === "meds-specific") && (
            <>
              <div className="w-full sm:w-auto text-center sm:text-left">
                <span className="text-[11px] font-bold text-slate-400 sm:mx-1 uppercase tracking-wider">vs</span>
              </div>
              <select
                value={targetMetric}
                onChange={(e) => setTargetMetric(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-sans text-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
              >
                {enabledTrackers.mood && <option value="mood">{lang === "es" ? "Estado de Ánimo" : "Mood"}</option>}
                {enabledTrackers.focus && <option value="concentration">{lang === "es" ? "Enfoque" : "Focus"}</option>}
                {enabledTrackers.sleep && <option value="sleepDuration">{lang === "es" ? "Horas de Sueño" : "Sleep Duration"}</option>}
                {enabledTrackers.sleep && <option value="sleepQuality">{lang === "es" ? "Calidad de Sueño" : "Sleep Quality"}</option>}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-[280px] w-full bg-slate-50/50 rounded-xl p-3 border border-slate-100">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Info className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
            <p className="text-xs font-sans">{t.noHistory}</p>
            <p className="text-[10px] mt-1 font-mono">{t.addEntryTip}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "monospace" }} 
                tickLine={false}
              />
              <YAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "monospace" }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.95)", 
                  borderColor: "#f1f5f9",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  fontSize: "11px",
                  fontFamily: "sans-serif"
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }}
                iconType="circle"
              />

              {/* Conditional renderings based on selection with translated metric labels */}
              {chartType === "mood-sleep" && (
                <>
                  <Bar dataKey="sleepQuality" name={lang === "es" ? "Calidad de Sueño (1-10)" : "Sleep Quality (1-10)"} fill="#a78bfa" opacity={0.5} barSize={20} radius={[4, 4, 0, 0]} />
                  <Area type="monotone" dataKey="mood" name={lang === "es" ? "Estado de Ánimo (1-10)" : "Mood Rating (1-10)"} stroke="#f59e0b" fill="url(#colorMood)" fillOpacity={0.1} strokeWidth={2.5} />
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </>
              )}

              {chartType === "concentration-sleep" && (
                <>
                  <Bar dataKey="sleepDuration" name={lang === "es" ? "Horas Registradas" : "Sleep Logged (Hours)"} fill="#818cf8" opacity={0.6} barSize={20} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="concentration" name={lang === "es" ? "Puntuación de Enfoque (1-10)" : "Focus Score (1-10)"} stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
                  <ReferenceLine y={7.0} stroke="#0d9488" strokeDasharray="3 3" label={{ value: lang === "es" ? "Meta de Enfoque" : "Target Focus", fill: "#0d9488", fontSize: 9, position: "top" }} />
                </>
              )}

              {chartType === "tasks-specific" && (
                <>
                  <Bar 
                    dataKey="specificHabitScore" 
                    name={selectedHabit 
                      ? `${selectedHabit} (${lang === "es" ? "Completado = 10" : "Completed = 10"})` 
                      : (lang === "es" ? "Hábito (10 = Completado)" : "Habit (10 = Completed)")
                    } 
                    fill="#ec4899" 
                    opacity={0.45} 
                    barSize={24} 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey={targetMetric} 
                    name={
                      targetMetric === "mood" ? (lang === "es" ? "Estado de Ánimo (1-10)" : "Mood Rating (1-10)") :
                      targetMetric === "concentration" ? (lang === "es" ? "Enfoque (1-10)" : "Focus Score (1-10)") :
                      targetMetric === "sleepDuration" ? (lang === "es" ? "Horas de Sueño" : "Sleep Duration") :
                      (lang === "es" ? "Calidad de Sueño (1-10)" : "Sleep Quality (1-10)")
                    } 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 5 }} 
                  />
                </>
              )}

              {chartType === "meds-specific" && (
                <>
                  <Bar 
                    dataKey="specificMedScore" 
                    name={selectedMed 
                      ? `${selectedMed} (${lang === "es" ? "Tomado = 10" : "Taken = 10"})` 
                      : (lang === "es" ? "Medicamento (10 = Tomado)" : "Medicine (10 = Taken)")
                    } 
                    fill="#f43f5e" 
                    opacity={0.5} 
                    barSize={24} 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey={targetMetric} 
                    name={
                      targetMetric === "mood" ? (lang === "es" ? "Estado de Ánimo (1-10)" : "Mood Rating (1-10)") :
                      targetMetric === "concentration" ? (lang === "es" ? "Enfoque (1-10)" : "Focus Score (1-10)") :
                      targetMetric === "sleepDuration" ? (lang === "es" ? "Horas de Sueño" : "Sleep Duration") :
                      (lang === "es" ? "Calidad de Sueño (1-10)" : "Sleep Quality (1-10)")
                    } 
                    stroke="#0d9488" 
                    strokeWidth={3} 
                    dot={{ r: 4 }} 
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

          {/* Trend Summary Description Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-500 font-semibold block">
                {t.chartTrendAnalysis}
              </span>
              <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed whitespace-pre-line select-text">
                {getCorrelationStatusText()}
              </p>
            </div>
          </div>
        </div>
      )}

      {(mode === "all" || mode === "stats") && (
        <>
          {/* LAST 7 DAYS WEEKLY SUMMARY SECTION */}
      <div id="weekly-summary-section" className="xl:col-span-2 bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 shrink-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-0">
              <BarChart2 className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-800">
                {lang === "es" ? "Resumen Semanal (Últimos 7 Días)" : "Weekly Summary (Last 7 Days)"}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                {lang === "es" 
                  ? "Instantánea de tus métricas clave de bienestar promediadas de los últimos 7 días con registro" 
                  : "Snapshot of your key well-being metrics averaged over the last 7 logged days"}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-200/50 border border-slate-300 font-mono text-[10px] text-slate-600 font-bold whitespace-nowrap flex-shrink-0">
            {last7DaysLogs.length} {lang === "es" ? "días" : "days"}
          </span>
        </div>

        {last7DaysLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 font-sans border border-dashed border-slate-200 rounded-xl">
            {lang === "es" 
              ? "Registra al menos un día para calcular tu resumen semanal." 
              : "Add at least one entry to verify your weekly summary metrics."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Mood Average Card */}
            {enabledTrackers.mood && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold">
                    {lang === "es" ? "Ánimo Promedio" : "Mood Average"}
                  </span>
                  <Smile className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-sans font-bold text-slate-800">
                    {last7AvgMood.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">/ 10</span>
                </div>
                
                {/* Progress bar background */}
                <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
                    style={{ width: `${Math.min(last7AvgMood * 10, 100)}%` }}
                  />
                </div>

                {/* Comparative baseline explanation */}
                <div className="mt-2 text-[9px] font-sans font-medium flex items-center justify-between">
                  <span className="text-slate-400">
                    {lang === "es" ? `Global: ${baselineMood.toFixed(1)}` : `Baseline: ${baselineMood.toFixed(1)}`}
                  </span>
                  {last7AvgMood > baselineMood ? (
                    <span className="text-emerald-600 font-bold flex items-center">
                      ▲ +{(last7AvgMood - baselineMood).toFixed(1)} {lang === "es" ? "mejor" : "higher"}
                    </span>
                  ) : last7AvgMood < baselineMood ? (
                    <span className="text-rose-500 font-semibold flex items-center">
                      ▼ -{Math.abs(last7AvgMood - baselineMood).toFixed(1)} {lang === "es" ? "menor" : "lower"}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">
                      = {lang === "es" ? "igual" : "stable"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. Sleep Quality Card */}
            {enabledTrackers.sleep && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold">
                    {lang === "es" ? "Calidad de Sueño" : "Sleep Quality"}
                  </span>
                  <Moon className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-sans font-bold text-slate-800">
                    {last7AvgSleepQuality.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">/ 10</span>
                </div>

                {/* Progress bar background */}
                <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" 
                    style={{ width: `${Math.min(last7AvgSleepQuality * 10, 100)}%` }}
                  />
                </div>

                {/* Comparative baseline explanation */}
                <div className="mt-2 text-[9px] font-sans font-medium flex items-center justify-between">
                  <span className="text-slate-400">
                    {lang === "es" ? `Global: ${baselineSleepQuality.toFixed(1)}` : `Baseline: ${baselineSleepQuality.toFixed(1)}`}
                  </span>
                  {last7AvgSleepQuality > baselineSleepQuality ? (
                    <span className="text-emerald-600 font-bold flex items-center">
                      ▲ +{(last7AvgSleepQuality - baselineSleepQuality).toFixed(1)} {lang === "es" ? "mejor" : "higher"}
                    </span>
                  ) : last7AvgSleepQuality < baselineSleepQuality ? (
                    <span className="text-rose-500 font-semibold flex items-center">
                      ▼ -{Math.abs(last7AvgSleepQuality - baselineSleepQuality).toFixed(1)} {lang === "es" ? "menor" : "lower"}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">
                      = {lang === "es" ? "igual" : "stable"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 3. Highest Impact Factor Card */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
              <div className="flex items-center gap-2 justify-between">
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold">
                  {lang === "es" ? "Factor Más Beneficioso" : "Most Beneficial Factor"}
                </span>
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              
              <div className="mt-2.5">
                {highestImpactFactor ? (
                  <>
                    <h4 className="text-sm font-sans font-bold text-slate-800 line-clamp-1">
                      {highestImpactFactor.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-1 leading-relaxed">
                      {highestImpactFactor.moodDifference > highestImpactFactor.focusDifference ? (
                        lang === "es"
                          ? `Asociado a un aumento de +${highestImpactFactor.moodDifference.toFixed(1)} en tu ánimo medio.`
                          : `Correlates with an increase of +${highestImpactFactor.moodDifference.toFixed(1)} on mood rating.`
                      ) : (
                        lang === "es"
                          ? `Asociado a un aumento de +${highestImpactFactor.focusDifference.toFixed(1)} en tu enfoque.`
                          : `Correlates with an increase of +${highestImpactFactor.focusDifference.toFixed(1)} on concentration.`
                      )}
                    </p>
                    <div className="mt-2.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(Math.max(highestImpactFactor.moodDifference, highestImpactFactor.focusDifference) * 20, 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-base font-sans font-bold text-slate-400 block">
                      {lang === "es" ? "Análisis Activo" : "Active Analysis"}
                    </span>
                    <p className="text-[9.5px] text-slate-400 font-sans leading-relaxed mt-1">
                      {lang === "es" 
                        ? "Registra hábitos de manera regular para aislar su impacto exacto de forma personalizada."
                        : "Log your routines consistently to isolate and display your exact beneficial wellness factors."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HEATMAP & DAILY INSIGHTS METRIC SELECTOR */}
      {(mode === "all" || mode === "stats") && (
        <div className="xl:col-span-2 flex items-center justify-center pt-2 pb-2">
          <div className="bg-slate-100/80 p-1.5 rounded-xl inline-flex shadow-sm border border-slate-200/50">
            {enabledTrackers.mood && (
              <button 
                onClick={() => setActiveHeatmapMetric("mood")}
                className={`px-4 py-1.5 text-xs font-sans font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${activeHeatmapMetric === "mood" ? "bg-white text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Smile className="w-3.5 h-3.5" />
                {lang === "es" ? "Ánimo" : "Mood"}
              </button>
            )}
            {enabledTrackers.sleep && (
              <button 
                onClick={() => setActiveHeatmapMetric("sleep")}
                className={`px-4 py-1.5 text-xs font-sans font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${activeHeatmapMetric === "sleep" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Moon className="w-3.5 h-3.5" />
                {lang === "es" ? "Sueño" : "Sleep"}
              </button>
            )}
            {enabledTrackers.focus && (
              <button 
                onClick={() => setActiveHeatmapMetric("focus")}
                className={`px-4 py-1.5 text-xs font-sans font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${activeHeatmapMetric === "focus" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Brain className="w-3.5 h-3.5" />
                {lang === "es" ? "Enfoque" : "Focus"}
              </button>
            )}
          </div>
        </div>
      )}

          {/* CALENDAR-BASED MOOD HEATMAP WIDGET */}
      {(() => {
        // Translation values for the monthly heatmap widget
        const heatmapTranslations = {
          en: {
            sectionTitle: activeHeatmapMetric === "sleep" 
              ? "Monthly Sleep Heatmap" 
              : activeHeatmapMetric === "focus" ? "Monthly Focus Heatmap" : "Monthly Mood Heatmap",
            sectionSubtitle: activeHeatmapMetric === "sleep" 
              ? "Daily sleep quality logs and correlation" 
              : activeHeatmapMetric === "focus" ? "Daily focus logs and correlation" : "Visual representation of daily mood logs and statistical correlation",
            prevMonth: "Previous Month",
            nextMonth: "Next Month",
            detailsTitle: "Daily Log Summary",
            noLogsOnDay: "No well-being log found for this day.",
            clickPrompt: "Click on any colored cell to explore your active routines, bedtime, focus stats, and notes.",
            moodScale: activeHeatmapMetric === "sleep" ? "Sleep Scale:" : activeHeatmapMetric === "focus" ? "Focus Scale:" : "Mood Scale:",
            struggling: "Low (1-3)",
            balanced: "Moderate (4-6)",
            radiant: "High (7-10)",
            sleep: "Sleep Hours",
            focus: "Focus Level",
            notes: "Notes",
            tags: "Feeling Tags",
            meds: "Medications",
            routines: "Routines Completed"
          },
          es: {
            sectionTitle: activeHeatmapMetric === "sleep" 
              ? "Mapa de Calor de Sueño" 
              : activeHeatmapMetric === "focus" ? "Mapa de Calor de Enfoque" : "Mapa de Calor de Ánimo",
            sectionSubtitle: activeHeatmapMetric === "sleep" 
              ? "Calidad de sueño diaria y correlación" 
              : activeHeatmapMetric === "focus" ? "Concentración diaria y correlación" : "Representación visual de registros diarios y correlación de bienestar",
            prevMonth: "Mes Anterior",
            nextMonth: "Mes Siguiente",
            detailsTitle: "Resumen de Registro Diario",
            noLogsOnDay: "No se encontró registro para este día.",
            clickPrompt: "Haz clic en una celda de color para explorar rutinas, horas de sueño, nivel de enfoque y notas del día.",
            moodScale: activeHeatmapMetric === "sleep" ? "Escala de Sueño:" : activeHeatmapMetric === "focus" ? "Escala de Enfoque:" : "Escala de Ánimo:",
            struggling: "Bajo (1-3)",
            balanced: "Moderado (4-6)",
            radiant: "Alto (7-10)",
            sleep: "Horas de Sueño",
            focus: "Nivel de Enfoque",
            notes: "Notas",
            tags: "Etiquetas",
            meds: "Medicamentos",
            routines: "Rutinas Completadas"
          }
        };

        const monthNamesEn = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const monthNamesEs = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const calendarDaysOfWeekHeaderEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const calendarDaysOfWeekHeaderEs = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        const ht = heatmapTranslations[lang];
        const monthNamesCurrent = lang === "es" ? monthNamesEs : monthNamesEn;
        const daysHeaderCurrent = lang === "es" ? calendarDaysOfWeekHeaderEs : calendarDaysOfWeekHeaderEn;

        // Month mathematical computations
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay(); // Sunday is 0, Monday is 1...
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        // Create the aligned day list
        const calendarGridArray: (number | null)[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
          calendarGridArray.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
          calendarGridArray.push(day);
        }

        const handlePrevMonth = () => {
          if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
          } else {
            setViewMonth((m) => m - 1);
          }
          setSelectedDayLog(null);
        };

        const handleNextMonth = () => {
          if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
          } else {
            setViewMonth((m) => m + 1);
          }
          setSelectedDayLog(null);
        };

        // Visual coloring selector based on mood numeric score
        const getCellStylesForDay = (entry: LogEntry | undefined, dayNum: number, dateKey: string) => {
          const sysDate = new Date();
          const sysYear = sysDate.getFullYear();
          const sysMonth = String(sysDate.getMonth() + 1).padStart(2, "0");
          const sysDay = String(sysDate.getDate()).padStart(2, "0");
          const sysTodayStr = `${sysYear}-${sysMonth}-${sysDay}`;
          const isToday = dateKey === sysTodayStr;

          let baseClassName = "aspect-square relative flex flex-col items-center justify-center rounded-xl text-xs font-sans font-semibold border transition-all cursor-pointer select-none outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 ";
          
          if (isToday) {
            const todayRingColor = activeHeatmapMetric === "sleep" ? "ring-blue-400" : activeHeatmapMetric === "focus" ? "ring-teal-400" : "ring-amber-400";
            baseClassName += `ring-2 ${todayRingColor} ring-offset-1 `;
          }

          if (!entry) {
            return {
              className: baseClassName + "bg-slate-50/70 border-slate-200/50 text-slate-400 hover:bg-slate-100/95 hover:border-slate-300",
              labelColor: "text-slate-400 font-normal"
            };
          }

          const val = activeHeatmapMetric === "sleep" ? entry.sleepQuality : activeHeatmapMetric === "focus" ? entry.concentration : entry.mood;

          if (activeHeatmapMetric === "sleep") {
            if (val <= 3) {
              return { className: baseClassName + "bg-rose-100/90 border-rose-350 text-rose-900 hover:bg-rose-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-rose-500/30 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-500/50", labelColor: "text-rose-900 dark:text-rose-300 font-bold" };
            }
            if (val <= 6) {
              return { className: baseClassName + "bg-indigo-100 border-indigo-300 text-indigo-950 hover:bg-indigo-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-indigo-500/30 dark:border-indigo-500/60 dark:text-indigo-300 dark:hover:bg-indigo-500/50", labelColor: "text-indigo-950 dark:text-indigo-300 font-bold" };
            }
            if (val <= 8) {
              return { className: baseClassName + "bg-blue-200 border-blue-400 text-blue-950 hover:bg-blue-300 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-blue-500/40 dark:border-blue-500/70 dark:text-blue-300 dark:hover:bg-blue-500/60", labelColor: "text-blue-950 dark:text-blue-200 font-black" };
            }
            return { className: baseClassName + "bg-blue-600 border-blue-700 text-white hover:bg-blue-700 hover:scale-[1.04] shadow-xs dark:bg-blue-500 dark:border-blue-400", labelColor: "text-white font-black" };
          }

          if (activeHeatmapMetric === "focus") {
            if (val <= 3) {
              return { className: baseClassName + "bg-rose-100/90 border-rose-350 text-rose-900 hover:bg-rose-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-rose-500/30 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-500/50", labelColor: "text-rose-900 dark:text-rose-300 font-bold" };
            }
            if (val <= 6) {
              return { className: baseClassName + "bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-amber-500/30 dark:border-amber-500/60 dark:text-amber-300 dark:hover:bg-amber-500/50", labelColor: "text-amber-950 dark:text-amber-300 font-bold" };
            }
            if (val <= 8) {
              return { className: baseClassName + "bg-teal-200 border-teal-400 text-teal-950 hover:bg-teal-300 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-teal-500/40 dark:border-teal-500/70 dark:text-teal-300 dark:hover:bg-teal-500/60", labelColor: "text-teal-950 dark:text-teal-200 font-black" };
            }
            return { className: baseClassName + "bg-teal-600 border-teal-700 text-white hover:bg-teal-700 hover:scale-[1.04] shadow-xs dark:bg-teal-500 dark:border-teal-400", labelColor: "text-white font-black" };
          }

          // Mood
          if (val <= 3) {
            return {
              className: baseClassName + "bg-rose-100/90 border-rose-350 text-rose-900 hover:bg-rose-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-rose-500/30 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-500/50",
              labelColor: "text-rose-900 dark:text-rose-300 font-bold"
            };
          }
          if (val <= 6) {
            return {
              className: baseClassName + "bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-amber-500/30 dark:border-amber-500/60 dark:text-amber-300 dark:hover:bg-amber-500/50",
              labelColor: "text-amber-950 dark:text-amber-300 font-bold"
            };
          }
          if (val <= 8) {
            return {
              className: baseClassName + "bg-emerald-100 border-emerald-300 text-emerald-950 hover:bg-emerald-200 hover:scale-[1.04] shadow-2xs hover:shadow-xs dark:bg-emerald-500/40 dark:border-emerald-500/70 dark:text-emerald-300 dark:hover:bg-emerald-500/60",
              labelColor: "text-emerald-955 dark:text-emerald-200 font-black"
            };
          }
          return {
            className: baseClassName + "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 hover:scale-[1.04] shadow-xs dark:bg-emerald-500 dark:border-emerald-400",
            labelColor: "text-white font-black"
          };
        };

        return (
          <div id="mood-heatmap-widget" className="xl:col-span-1 bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4 animate-fade-in">
            {/* Header section with navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border dark:border-0 ${
                  activeHeatmapMetric === "sleep" ? "bg-blue-500/10 text-blue-600 border-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400" 
                  : activeHeatmapMetric === "focus" ? "bg-teal-500/10 text-teal-600 border-teal-200/50 dark:bg-teal-500/20 dark:text-teal-400" 
                  : "bg-amber-500/10 text-amber-500 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400"
                }`}>
                  <Calendar className="w-5 h-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {ht.sectionTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans leading-tight">
                    {ht.sectionSubtitle}
                  </p>
                </div>
              </div>

              {/* Month switcher action controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={handlePrevMonth}
                  title={ht.prevMonth}
                  className="p-1 px-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer text-xs font-semibold flex items-center justify-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-extrabold text-slate-700 min-w-[120px] text-center select-none shadow-2xs">
                  {monthNamesCurrent[viewMonth]} {viewYear}
                </span>

                <button
                  onClick={handleNextMonth}
                  title={ht.nextMonth}
                  className="p-1 px-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer text-xs font-semibold flex items-center justify-center"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grid display layout */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-w-sm mx-auto">
              {daysHeaderCurrent.map((heading, idx) => (
                <div key={idx} className="text-center text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider py-1 select-none">
                  {heading}
                </div>
              ))}

              {calendarGridArray.map((dayNum, idx) => {
                if (dayNum === null) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="aspect-square bg-slate-100/20 border border-slate-100/10 rounded-xl select-none opacity-20" 
                    />
                  );
                }

                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayLogEntry = history.find((e) => e.date === dateKey);
                const { className, labelColor } = getCellStylesForDay(dayLogEntry, dayNum, dateKey);
                const isActiveLogSelected = selectedDayLog?.date === dateKey;
                const activeRingClass = activeHeatmapMetric === "sleep" ? "ring-blue-600 border-blue-700" : activeHeatmapMetric === "focus" ? "ring-teal-600 border-teal-700" : "ring-amber-500 border-amber-600";

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (dayLogEntry) {
                        setSelectedDayLog(dayLogEntry);
                      }
                    }}
                    className={`${className} ${isActiveLogSelected ? `ring-2 ${activeRingClass} ring-offset-2 scale-102 shadow-md` : ""}`}
                    disabled={!dayLogEntry}
                  >
                    <span className={labelColor}>{dayNum}</span>
                    {dayLogEntry && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        (activeHeatmapMetric === "sleep" ? dayLogEntry.sleepQuality : activeHeatmapMetric === "focus" ? dayLogEntry.concentration : dayLogEntry.mood) >= 9 
                        ? "bg-white" 
                        : (activeHeatmapMetric === "sleep" ? "bg-blue-600/60" : activeHeatmapMetric === "focus" ? "bg-teal-600/60" : "bg-amber-600/60")
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scale legend label indicator */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 font-sans select-none">
              <span className="font-semibold flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></span>
                {ht.moodScale}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300 dark:bg-rose-500/30 dark:border-rose-500/60 inline-block"></span>
                  {ht.struggling}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded border inline-block ${activeHeatmapMetric === "sleep" ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-500/30 dark:border-indigo-500/60" : activeHeatmapMetric === "focus" ? "bg-amber-100 border-amber-300 dark:bg-amber-500/30 dark:border-amber-500/60" : "bg-amber-100/90 border-amber-300 dark:bg-amber-500/30 dark:border-amber-500/60"}`}></span>
                  {ht.balanced}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded border inline-block ${activeHeatmapMetric === "sleep" ? "bg-blue-200 border-blue-400 dark:bg-blue-500/40 dark:border-blue-500/70" : activeHeatmapMetric === "focus" ? "bg-teal-200 border-teal-400 dark:bg-teal-500/40 dark:border-teal-500/70" : "bg-emerald-100 border-emerald-300 dark:bg-emerald-500/40 dark:border-emerald-500/70"}`}></span>
                  {lang === "es" ? "Alto (7-8)" : "High (7-8)"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded border inline-block ${activeHeatmapMetric === "sleep" ? "bg-blue-600 border-blue-700 dark:bg-blue-500 dark:border-blue-400" : activeHeatmapMetric === "focus" ? "bg-teal-600 border-teal-700 dark:bg-teal-500 dark:border-teal-400" : "bg-emerald-600 border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400"}`}></span>
                  {lang === "es" ? "Excelente (9-10)" : "Excellent (9-10)"}
                </span>
              </div>
            </div>

            {/* Interactive slide-in day summary card */}
            <div className="transition-all duration-300">
              {selectedDayLog ? (
                <div className="bg-white rounded-xl border border-indigo-100/50 shadow-2xs p-4 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between gap-3 border-b border-indigo-50/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {lang === "es" ? "Registro Detallado:" : "Log Details:"} {selectedDayLog.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-55/10 border border-indigo-100 text-indigo-700 text-[10px] font-sans font-bold">
                      {lang === "es" ? "Ánimo" : "Mood"}: {selectedDayLog.mood}/10
                    </div>
                  </div>

                  {/* Dynamic mini layout stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] font-sans">
                    {/* Sleep stats */}
                    <div className="space-y-1 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider text-[9px] select-none">
                        <Moon className="w-3.5 h-3.5 text-blue-500" />
                        {ht.sleep}
                      </span>
                      <div className="space-y-0.5 text-slate-600 font-medium font-mono pt-1">
                        <p className="flex justify-between">
                          <span className="text-slate-400">{lang === "es" ? "Duración:" : "Duration:"}</span> 
                          <span className="text-slate-700 font-bold">{selectedDayLog.sleepDuration || 0}h</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">{lang === "es" ? "Horario:" : "Schedule:"}</span> 
                          <span>{selectedDayLog.bedtime || "--:--"} - {selectedDayLog.waketime || "--:--"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">{lang === "es" ? "Calidad:" : "Quality:"}</span> 
                          <span className="font-semibold text-blue-600">{selectedDayLog.sleepQuality}/10</span>
                        </p>
                      </div>
                    </div>

                    {/* Focus statistics & tags */}
                    <div className="space-y-1 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider text-[9px] select-none">
                        <Brain className="w-3.5 h-3.5 text-teal-500" />
                        {lang === "es" ? "Métricas" : "Metrics"}
                      </span>
                      <div className="space-y-1 pt-1">
                        <p className="flex justify-between text-slate-600 font-medium font-mono">
                          <span className="text-slate-400">{ht.focus}:</span> 
                          <span className="text-teal-600 font-bold">{selectedDayLog.concentration || 0}/10</span>
                        </p>
                        
                        {selectedDayLog.moodTags && selectedDayLog.moodTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {selectedDayLog.moodTags.map((tag, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-sans font-medium hover:bg-indigo-150 transition-colors uppercase tracking-tight"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task routines */}
                    <div className="space-y-1 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200/50 sm:col-span-2">
                      <span className="font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider text-[9px] select-none">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        {ht.routines}
                      </span>
                      {selectedDayLog.tasks && selectedDayLog.tasks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedDayLog.tasks.map((task) => (
                            <span 
                              key={task.id} 
                              className={`px-2 py-0.5 text-[9px] rounded-md font-sans font-medium flex items-center gap-1 border ${
                                task.completed 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                  : "bg-slate-100 text-slate-400 border-slate-200/60 line-through"
                              }`}
                            >
                              <span className={`w-1 h-1 rounded-full ${task.completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                              {task.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic select-none pt-1">
                          {lang === "es" ? "No se registraron rutinas este día." : "No routines tracked for this day."}
                        </p>
                      )}
                    </div>

                    {/* Medications list */}
                    {selectedDayLog.medications && selectedDayLog.medications.length > 0 && (
                      <div className="space-y-1 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200/50 sm:col-span-2">
                        <span className="font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider text-[9px] select-none">
                          <span className="text-red-500 tracking-normal inline-flex items-center">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 21V15H3V9H9V3H15V9H21V15H15V21H9Z" />
                            </svg>
                          </span>
                          {ht.meds}
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedDayLog.medications.map((med) => (
                            <span 
                              key={med.id} 
                              className={`px-2 py-0.5 text-[9px] rounded-md font-sans font-medium flex items-center gap-1 border ${
                                med.taken 
                                  ? "bg-rose-50 text-rose-800 border-rose-100" 
                                  : "bg-slate-100/80 text-slate-500 border-slate-200/50"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${med.taken ? "bg-rose-500" : "bg-slate-400"}`} />
                              {med.name} ({med.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-white/40 border border-slate-200/50 border-dashed rounded-xl select-none">
                  <span className="text-[11px] text-slate-400 font-sans flex flex-col items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-55/50 rounded-full animate-pulse"></span>
                    {history.length === 0 ? (
                      lang === "es"
                        ? "No hay datos de bienestar aún. ¡Guarda tu primer registro diario en la ficha de la izquierda para ver cómo se va coloreando tu mapa de calor de ánimo mensual!"
                        : "No well-being data yet. Save your first daily log in the form on the left to watch your monthly mood heatmap light up!"
                    ) : ht.clickPrompt}
                  </span>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* DAY-OF-THE-WEEK INSIGHTS SECTION */}
      <div className="xl:col-span-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border dark:border-0 ${
              activeHeatmapMetric === "sleep" ? "bg-blue-500/10 text-blue-600 border-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400" 
              : activeHeatmapMetric === "focus" ? "bg-teal-500/10 text-teal-600 border-teal-200/50 dark:bg-teal-500/20 dark:text-teal-400" 
              : "bg-amber-500/10 text-amber-500 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400"
            }`}>
              <Activity className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
                {lang === "es" 
                  ? `Perspectivas de ${activeHeatmapMetric === "sleep" ? "Sueño" : activeHeatmapMetric === "focus" ? "Enfoque" : "Ánimo"} Diarias` 
                  : `Day-of-the-Week ${activeHeatmapMetric === "sleep" ? "Sleep" : activeHeatmapMetric === "focus" ? "Focus" : "Mood"} Insights`}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                {lang === "es" 
                  ? `Comparación de promedios por día de la semana para descubrir patrones` 
                  : `Compare average values across weekdays and weekends to identify patterns`}
              </p>
            </div>
          </div>
        </div>

        {daysWithData.length < 2 ? (
          <div className="text-center py-6 px-4 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/50 dark:bg-slate-900/30">
            <p className="text-xs text-slate-400 dark:text-slate-500 italic font-sans animate-pulse">
              {lang === "es" 
                ? "Registra datos en al menos 2 días distintos de la semana para revelar patrones y correlaciones de conducta." 
                : "Log entries on at least 2 different days of the week to reveal weekly patterns and behavioral correlations."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-stretch">
            {/* Left Column: Bar Chart */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 font-bold block mb-3.5">
                {lang === "es" ? "PROMEDIO POR DÍA" : "AVERAGE BY DAY"}
              </span>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={orderedDayOfWeekData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#e2e8f0"} vertical={false} opacity={0.4} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9, fill: theme === "dark" ? "#94a3b8" : "#64748b", fontWeight: "bold", fontFamily: "monospace" }} 
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      tick={{ fontSize: 9, fill: theme === "dark" ? "#94a3b8" : "#64748b", fontFamily: "monospace" }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: theme === "dark" ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.04)' }}
                      contentStyle={{ 
                        backgroundColor: theme === "dark" ? "#1e293b" : "rgba(255, 255, 255, 0.98)", 
                        borderColor: theme === "dark" ? "#334155" : "#f1f5f9",
                        borderRadius: "10px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        fontSize: "11px",
                        fontFamily: "sans-serif",
                        color: theme === "dark" ? "#f1f5f9" : "#1e293b"
                      }}
                      formatter={(value: any) => [
                        `${value}/10`, 
                        activeHeatmapMetric === "sleep" ? (lang === "es" ? "Calidad de Sueño" : "Sleep Quality") 
                        : activeHeatmapMetric === "focus" ? (lang === "es" ? "Nivel de Enfoque" : "Focus Level") 
                        : (lang === "es" ? "Ánimo Promedio" : "Average Mood")
                      ]}
                    />
                    <Bar 
                      dataKey="avgMetric" 
                      name={lang === "es" ? "Promedio" : "Average"} 
                      fill={activeHeatmapMetric === "sleep" ? "#3b82f6" : activeHeatmapMetric === "focus" ? "#14b8a6" : "#f59e0b"} 
                      radius={[4, 4, 0, 0]} 
                      barSize={24}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column: Narrative & Insights */}
            <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
              
              {/* Best vs Toughest comparison indicators */}
              <div className="grid grid-cols-2 gap-3">
                {bestDay && (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl">
                    <span className="text-[10px] font-sans font-medium text-emerald-600 dark:text-emerald-400 block tracking-tight">
                      {lang === "es" ? "🟢 Mejor Día" : "🟢 Best Day"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-1">
                      {bestDay.fullName}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      {bestDay.avgMetric.toFixed(1)}/10
                    </span>
                  </div>
                )}

                {toughestDay && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl">
                    <span className="text-[10px] font-sans font-medium text-amber-600 dark:text-amber-400 block tracking-tight">
                      {lang === "es" ? "🟡 Más Desafiante" : "🟡 Toughest Day"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-1">
                      {toughestDay.fullName}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">
                      {toughestDay.avgMetric.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>

              {/* Weekly Balance Analysis block */}
              <div className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl flex-1 flex flex-col justify-center">
                <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 font-bold block mb-2">
                  {lang === "es" ? "ANÁLISIS DE BALANCE" : "WEEKLY BALANCE ANALYSIS"}
                </span>
                
                {/* Micro metrics comparison */}
                <div className="flex items-center justify-between text-xs font-medium pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {lang === "es" ? "Lu-Vi (Laboral):" : "Mon-Fri (Weekdays):"}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {avgWeekdayMetric > 0 ? `${avgWeekdayMetric.toFixed(1)}/10` : "--"}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {lang === "es" ? "Sá-Do (Fin de Sem):" : "Sat-Sun (Weekends):"}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {avgWeekendMetric > 0 ? `${avgWeekendMetric.toFixed(1)}/10` : "--"}
                  </span>
                </div>

                <div className="flex gap-2.5 items-start mt-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono shrink-0 mt-0.5">
                    i
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                    {getInsightNarrative()}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

        </>
      )}
    </div>
  );
}
