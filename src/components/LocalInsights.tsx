import React, { useState } from "react";
import { LogEntry, EnabledTrackers } from "../types";
import { calculateLocalInsights } from "../utils/heuristics";
import { translations } from "../utils/translations";
import { 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Smile, 
  Activity, 
  Moon, 
  Brain,
  RotateCcw,
  CheckCircle,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  LineChart
} from "lucide-react";

interface LocalInsightsProps {
  history: LogEntry[];
  googleName?: string;
  onCommitHabit: (habitName: string) => void;
  lang: "en" | "es";
  enabledTrackers: EnabledTrackers;
}

export default function LocalInsights({ history, googleName, onCommitHabit, lang, enabledTrackers }: LocalInsightsProps) {
  const t = translations[lang];
  const [calculationTrigger, setCalculationTrigger] = useState<number>(0);

  // Run dynamic heuristics calculations
  const insights = calculateLocalInsights(history, lang, enabledTrackers);

  const handleRecalculate = () => {
    // Increment to trigger a visual layout refresh/recalculation animation
    setCalculationTrigger(prev => prev + 1);
  };

  // Helper to determine score rating description
  const getScoreRating = (score: number) => {
    if (score >= 85) {
      return { 
        label: lang === "es" ? "Próspero y Fuerte" : "Thriving & Strong", 
        color: "text-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" 
      };
    }
    if (score >= 70) {
      return { 
        label: lang === "es" ? "Equilibrado y Estable" : "Balanced & Grounded", 
        color: "text-indigo-500 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30" 
      };
    }
    if (score >= 55) {
      return { 
        label: lang === "es" ? "Inconsistencias Leves" : "Mild Inconsistencies", 
        color: "text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" 
      };
    }
    return { 
      label: lang === "es" ? "Requiere Atención" : "Requires Attention", 
      color: "text-rose-500 bg-rose-50 dark:text-rose-450 dark:bg-rose-950/30" 
    };
  };

  const getTargetAreaIcon = (area: string) => {
    const norm = area.toLowerCase();
    if (norm.includes("mood") || norm.includes("ánimo") || norm.includes("humor")) return <Smile className="w-3.5 h-3.5 text-amber-500" />;
    if (norm.includes("sleep") || norm.includes("sueño") || norm.includes("rest")) return <Moon className="w-3.5 h-3.5 text-blue-500" />;
    if (norm.includes("focus") || norm.includes("concen") || norm.includes("enfoque")) return <Brain className="w-3.5 h-3.5 text-teal-500" />;
    if (norm.includes("med") || norm.includes("toma")) return (
      <span className="text-red-500 shrink-0 inline-flex items-center">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 21V15H3V9H9V3H15V9H21V15H15V21H9Z" />
        </svg>
      </span>
    );
    if (norm.includes("rout") || norm.includes("hab") || norm.includes("task") || norm.includes("tarea") || norm.includes("cumpl")) {
      return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
    }
    return <Activity className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const scoreRating = getScoreRating(insights.wellbeingScore);

  return (
    <div id="local-insights-panel" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 p-6 space-y-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            {t.localAdvisorTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
            {t.localAdvisorSubtitle}
          </p>
        </div>

        {history.length >= 2 && (
          <button
            onClick={handleRecalculate}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-sans cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {t.recalculate}
          </button>
        )}
      </div>

      {/* BEFORE INSIGHTS GENERATION / INSUFFICIENT DATA */}
      {history.length < 2 ? (
        <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Compass className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-100 text-base">
              {t.insufficientDataTitle}
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 font-sans leading-relaxed">
              {t.insufficientDataDesc}
            </p>
          </div>
        </div>
      ) : (
        <div id="insights-grid" className="space-y-6 key={calculationTrigger}">
          
          {/* Bento Top Row: Score + Narrative */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Wellbeing index score panel */}
            <div className="bg-slate-50/30 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100/60 dark:border-slate-800/50 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase">
                {lang === "es" ? "ÍNDICE DE ADHERENCIA" : "WELL-BEING ADHERENCE"}
              </span>
              
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Visual Circle Meter */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="42"
                    stroke="#6366f1"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={263.8}
                    strokeDashoffset={263.8 - (263.8 * insights.wellbeingScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
                    {insights.wellbeingScore}
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500">
                    / 100
                  </span>
                </div>
              </div>

              <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreRating.color}`}>
                {scoreRating.label}
              </div>
            </div>

            {/* 2. Narrative summary written by localized analyzer */}
            <div className="bg-linear-to-br from-indigo-50/5 to-amber-50/5 dark:from-indigo-950/20 dark:to-orange-950/5 p-5 rounded-2xl border border-slate-100/80 dark:border-slate-800 space-y-3 flex flex-col justify-center">
              <h3 className="font-sans font-semibold text-[13px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                {t.summaryTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed select-text">
                {insights.overallSummary}
              </p>
              {googleName && (
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {t.prepareFor.replace("{name}", googleName)}
                </div>
              )}
            </div>
          </div>

          {/* Bento Mid Row: Calculted Statistical Correlations */}
          {insights.correlations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                {t.correlationsTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.correlations.map((corr, idx) => {
                  const isPositive = corr.direction.toLowerCase().includes("pos");
                  const isNegative = corr.direction.toLowerCase().includes("neg");

                  return (
                    <div 
                      key={idx} 
                      className="bg-white dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100/80 dark:border-slate-800/80 flex flex-col gap-2 hover:shadow-xs dark:hover:bg-slate-950/60 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 px-1.5 py-0.5 rounded-md">
                            {corr.categoryA}
                          </span>
                          <span className="text-[8.5px] text-slate-400">x</span>
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/45 px-1.5 py-0.5 rounded-md">
                            {corr.categoryB}
                          </span>
                        </div>

                        {/* Direction Icon Badges */}
                        {isPositive && (
                          <span className="text-[8.5px] font-semibold font-mono text-emerald-600 bg-emerald-50 flex items-center gap-0.5 px-2 py-0.5 rounded-full dark:text-emerald-400 dark:bg-emerald-950/30">
                            <ArrowUpRight className="w-2.5 h-2.5" /> {t.positive}
                          </span>
                        )}
                        {isNegative && (
                          <span className="text-[8.5px] font-semibold font-mono text-rose-600 bg-rose-50 flex items-center gap-0.5 px-2 py-0.5 rounded-full dark:text-rose-400 dark:bg-rose-950/30">
                            <ArrowDownRight className="w-2.5 h-2.5" /> {t.negative}
                          </span>
                        )}
                        {!isPositive && !isNegative && (
                          <span className="text-[8.5px] font-semibold font-mono text-slate-500 bg-slate-50 flex items-center px-2 py-0.5 rounded-full dark:text-slate-400 dark:bg-slate-800/40">
                            {t.neutral}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                        {corr.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Factor Impact Analysis Block */}
          {insights.individualImpacts && insights.individualImpacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h3 className="font-sans font-semibold text-[13px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  {lang === "es" ? "Impacto Individual de Hábitos y Medicamentos" : "Individual Habit & Medication Impact"}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                  {lang === "es" 
                    ? "Análisis estadístico directo de cómo cada elemento influye individualmente en tus niveles promedio de ánimo y enfoque."
                    : "Direct statistical evidence of how each individual element alters your baseline mood and focus rating."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {insights.individualImpacts.map((factor, idx) => {
                  const isHabit = factor.type === "habit";
                  const hasMoodChange = Math.abs(factor.moodDifference) > 0.1;
                  const hasFocusChange = Math.abs(factor.focusDifference) > 0.1;

                  return (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-slate-950/45 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-100 dark:hover:border-indigo-950 hover:bg-slate-50/10 transition-all flex flex-col justify-between gap-3"
                    >
                      {/* Name & Tag */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2 overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans truncate pr-1" title={factor.name}>
                            {factor.name} {factor.dosage ? `(${factor.dosage})` : ""}
                          </h4>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase shrink-0 ${
                            isHabit 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          }`}>
                            {isHabit 
                              ? (lang === "es" ? "Hábito" : "Habit") 
                              : (lang === "es" ? "Medicina" : "Medicine")}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {lang === "es" 
                            ? `Ocurrencia: ${factor.daysCompleted}/${factor.daysPresent} días`
                            : `Logged: ${factor.daysCompleted}/${factor.daysPresent} days`}
                        </p>
                      </div>

                      {/* Stat Deltas */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50 dark:border-slate-900">
                        {/* Mood Delta */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans block">
                            {lang === "es" ? "Ánimo" : "Mood"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasMoodChange ? (
                              <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                                factor.moodDifference > 0 
                                  ? "text-emerald-600 dark:text-emerald-400" 
                                  : "text-rose-600 dark:text-rose-450"
                              }`}>
                                {factor.moodDifference > 0 ? "+" : ""}{factor.moodDifference.toFixed(1)} 
                                <span className="text-[9px]">{factor.moodDifference > 0 ? "▲" : "▼"}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                                = {lang === "es" ? "estable" : "stable"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Focus Delta */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans block">
                            {lang === "es" ? "Enfoque" : "Focus"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasFocusChange ? (
                              <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                                factor.focusDifference > 0 
                                  ? "text-emerald-600 dark:text-emerald-400" 
                                  : "text-rose-600 dark:text-rose-450"
                              }`}>
                                {factor.focusDifference > 0 ? "+" : ""}{factor.focusDifference.toFixed(1)}
                                <span className="text-[9px]">{factor.focusDifference > 0 ? "▲" : "▼"}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                                = {lang === "es" ? "estable" : "stable"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Associated Tags */}
                      {factor.associatedTags && factor.associatedTags.length > 0 && (
                        <div className="pt-2 mt-1 border-t border-slate-50 dark:border-slate-900 flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans mr-0.5">
                            {(t as any).associatedWith}
                          </span>
                          {factor.associatedTags.slice(0, 3).map((tag: string) => {
                            const tagTranslation = t.tags?.[tag] || tag;
                            return (
                              <span key={tag} className="text-[9px] font-medium font-sans bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase">
                                {tagTranslation}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bento Bottom Row: Actionable Habits */}
          <div className="space-y-3">
            <h3 className="font-sans font-semibold text-[13px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
              {t.actionableHabitsTitle}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {insights.actionableInsights.map((act, idx) => {
                const effortLower = act.difficulty?.toLowerCase();
                const difficultyLabel = lang === "es"
                  ? (effortLower === "easy" ? "Fácil" : effortLower === "medium" ? "Medio" : "Fuerte")
                  : act.difficulty;

                const diffColor = 
                  effortLower === "easy" ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" :
                  effortLower === "medium" || effortLower === "med" ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" :
                  "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30";

                return (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border border-slate-100/80 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${diffColor}`}>
                          {difficultyLabel} {t.difficulty}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize">
                          {getTargetAreaIcon(act.targetArea)}
                          {act.targetArea}
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-sans leading-snug">
                        {act.habit}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                        {act.impact}
                      </p>
                    </div>

                    <button
                      onClick={() => onCommitHabit(act.habit)}
                      className="w-full bg-white dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/30 text-[10px] font-sans font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      {t.commitRoutine}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bullet columns: successes vs warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="bg-emerald-50/10 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100/30 dark:border-emerald-900/30 space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-emerald-800 dark:text-emerald-305 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                {t.positivesTitle}
              </h3>
              <ul className="space-y-1.5">
                {insights.positives.map((pos, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 font-sans flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{pos}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/10 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100/30 dark:border-amber-900/30 space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-amber-800 dark:text-amber-305 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-450" />
                {t.warningsTitle}
              </h3>
              <ul className="space-y-1.5">
                {insights.warnings.map((warn, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 font-sans flex items-start gap-2">
                    <span className="text-amber-500 font-bold shrink-0 mt-0.5">!</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center font-mono text-[9px] text-slate-400 dark:text-slate-500 italic">
            {lang === "es" 
              ? "Heurística calculada localmente 100% libre de procesamiento externo." 
              : "Heuristic rules computed 100% locally on device."}
          </div>

        </div>
      )}

    </div>
  );
}
