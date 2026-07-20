import React, { useState, useEffect } from "react";
import { LogEntry, TaskItem, MedicationItem, EnabledTrackers, TrackerCategory } from "../types";
import { calculateSleepDuration, getTodayDateString } from "../utils/helpers";
import { translations } from "../utils/translations";
import { 
  Smile, 
  Moon, 
  Brain, 
  CheckSquare, 
  Square,
  Plus, 
  Trash2, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Calendar
} from "lucide-react";

interface TrackingFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  entry: LogEntry | undefined;
  onSave: (entry: LogEntry) => void;
  medicationTemplate: { name: string; dosage: string }[];
  onAddMedicationTemplate: (name: string, dosage: string) => void;
  habitsTemplate: { name: string }[];
  onAddHabitTemplate: (name: string) => void;
  customTrackersTemplate?: { name: string; category?: TrackerCategory }[];
  onAddCustomTrackerTemplate?: (name: string, category: TrackerCategory) => void;
  lang: "en" | "es";
  enabledTrackers: EnabledTrackers;
}

export default function TrackingForm({
  selectedDate,
  setSelectedDate,
  entry,
  onSave,
  medicationTemplate,
  onAddMedicationTemplate,
  habitsTemplate,
  onAddHabitTemplate,
  customTrackersTemplate = [],
  onAddCustomTrackerTemplate = () => {},
  lang,
  enabledTrackers
}: TrackingFormProps) {
  const t = translations[lang];

  // Local state representing form fields
  const [mood, setMood] = useState<number>(7);

  const [moodTags, setMoodTags] = useState<string[]>([]);
  
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [bedtime, setBedtime] = useState<string>("22:30");
  const [waketime, setWaketime] = useState<string>("07:00");
  const [tookNap, setTookNap] = useState<boolean>(false);
  const [napDuration, setNapDuration] = useState<number>(1);
  
  const [concentration, setConcentration] = useState<number>(7);
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskName, setNewTaskName] = useState<string>("");
  
  const [customTrackers, setCustomTrackers] = useState<{ id: string, name: string, value: boolean, category?: TrackerCategory }[]>([]);
  const [newCustomTrackerName, setNewCustomTrackerName] = useState<string>("");

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [newMedName, setNewMedName] = useState<string>("");
  const [newMedDosage, setNewMedDosage] = useState<string>("1 pill");

  const availableTags = [
    { name: "calm" },
    { name: "energetic" },
    { name: "tired" },
    { name: "anxious" },
    { name: "stressed" },
    { name: "hyperfocused" },
    { name: "peaceful" },
    { name: "sad" },
    { name: "restless" }
  ];

  // Sync state when entry or selectedDate changes
  useEffect(() => {
    if (entry) {
      setMood(entry.mood);

      setMoodTags(entry.moodTags || []);
      setSleepQuality(entry.sleepQuality);
      setBedtime(entry.bedtime || "22:30");
      setWaketime(entry.waketime || "07:00");
      setTookNap(entry.tookNap || false);
      setNapDuration(entry.napDuration || 1);
      setConcentration(entry.concentration);
      
      
      let currentTasks = entry.tasks || [];
      let currentMeds = entry.medications || [];
      let currentCustomTrackers = entry.customTrackers || [];

      // If it's today, automatically append any new templates that aren't present
      if (selectedDate === getTodayDateString()) {
        const newTasks = [...currentTasks];
        habitsTemplate.forEach((h, i) => {
          if (!newTasks.some(t => t.name.toLowerCase() === h.name.toLowerCase())) {
            newTasks.push({
              id: `template-task-new-${i}-${Date.now()}`,
              name: h.name,
              completed: false
            });
          }
        });
        
        const newCustomTrackers = [...currentCustomTrackers];
        customTrackersTemplate.forEach((ct, i) => {
          if (!newCustomTrackers.some(t => t.name.toLowerCase() === ct.name.toLowerCase())) {
            newCustomTrackers.push({
              id: `template-custom-new-${i}-${Date.now()}`,
              name: ct.name,
              value: false,
              category: ct.category
            });
          }
        });

        const newMeds = [...currentMeds];
        medicationTemplate.forEach((m, index) => {
          const existingMed = newMeds.find(cm => cm.name.toLowerCase() === m.name.toLowerCase());
          if (existingMed) {
            if (existingMed.dosage !== m.dosage) {
              existingMed.dosage = m.dosage;
            }
          } else {
            newMeds.push({
              id: `template-med-new-${index}-${Date.now()}`,
              name: m.name,
              dosage: m.dosage,
              taken: false
            });
          }
        });
        
        currentTasks = newTasks;
        currentCustomTrackers = newCustomTrackers;
        currentMeds = newMeds;
      }

      setTasks(currentTasks);
      setCustomTrackers(currentCustomTrackers);
      setMedications(currentMeds);
    } else {
      // Set clean defaults for a new log
      setMood(7);

      setMoodTags([]);
      setSleepQuality(7);
      setBedtime("22:30");
      setWaketime("07:00");
      setTookNap(false);
      setNapDuration(1);
      setConcentration(7);
      
      // Auto-populate default checklist tasks from habits design/template
      const initialTasks = habitsTemplate.map((h, i) => ({
        id: `template-task-${i}-${Date.now()}`,
        name: h.name,
        completed: false
      }));
      setTasks(initialTasks);

      const initialCustomTrackers = customTrackersTemplate.map((ct, i) => ({
        id: `template-custom-${i}-${Date.now()}`,
        name: ct.name,
        value: false,
        category: (ct as any).category || "mood"
      }));
      setCustomTrackers(initialCustomTrackers);

      // Initialize medications from current template list
      const initialMeds = medicationTemplate.map((m, index) => ({
        id: `template-${index}-${Date.now()}`,
        name: m.name,
        dosage: m.dosage,
        taken: false
      }));
      setMedications(initialMeds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, selectedDate]);

  const toggleTag = (tagName: string) => {
    if (moodTags.includes(tagName)) {
      setMoodTags(moodTags.filter((t) => t !== tagName));
    } else {
      setMoodTags([...moodTags, tagName]);
    }
  };

  const getMoodLabel = (score: number) => {
    if (lang === "es") {
      if (score <= 2) return { text: "Muy difícil", color: "text-red-500" };
      if (score <= 4) return { text: "Energía baja / Indispuesto", color: "text-orange-500" };
      if (score <= 6) return { text: "Aceptable / Neutral", color: "text-yellow-600" };
      if (score <= 8) return { text: "Bien y en paz", color: "text-emerald-500" };
      return { text: "Excelente y Radiante", color: "text-purple-500" };
    } else {
      if (score <= 2) return { text: "Struggling deeply", color: "text-red-500" };
      if (score <= 4) return { text: "Low energy / Unwell", color: "text-orange-500" };
      if (score <= 6) return { text: "Okay / Neutral", color: "text-yellow-600" };
      if (score <= 8) return { text: "Good & Peaceful", color: "text-emerald-500" };
      return { text: "Excellent & Radiant", color: "text-purple-500" };
    }
  };

  const getSleepLabel = (score: number) => {
    if (score <= 2) return t.sleepTerrible;
    if (score <= 4) return t.sleepRestless;
    if (score <= 6) return t.sleepDecent;
    if (score <= 8) return t.sleepRestful;
    return t.sleepDeep;
  };

  const getConcentrationLabel = (score: number) => {
    if (lang === "es") {
      if (score <= 2) return "Extremadamente distraído, niebla";
      if (score <= 4) return "Propenso a distracciones / inquieto";
      if (score <= 6) return "Moderadamente enfocado, flujo normal";
      if (score <= 8) return "Buena claridad, productividad alta";
      return "Atención impecable, estado de flujo total";
    } else {
      if (score <= 2) return "Extremely distracted, brain fog";
      if (score <= 4) return "Prone to distractions / restless";
      if (score <= 6) return "Somewhat focused, moderate flow";
      if (score <= 8) return "Good clarity, high productivity";
      return "Flawless attention, pure flow-state";
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const nameStr = newTaskName.trim();
    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random()}`,
      name: nameStr,
      completed: false
    };
    setTasks([...tasks, newTask]);
    onAddHabitTemplate(nameStr);
    setNewTaskName("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleCustomTracker = (id: string) => {
    setCustomTrackers(customTrackers.map((t) => t.id === id ? { ...t, value: !t.value } : t));
  };

  const removeCustomTracker = (id: string) => {
    setCustomTrackers(customTrackers.filter((t) => t.id !== id));
  };

  const renderCustomTrackersForCategory = (category: "mood" | "sleep" | "focus") => {
    if (!enabledTrackers.customTrackers) return null;
    const trackers = customTrackers.filter(ct => ct.category === category || (!ct.category && category === "mood"));
    if (trackers.length === 0) return null;

    return (
      <div className="pt-2 mt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
        <label className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1">
          {(t as any).customMarkers}
        </label>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
          {trackers.map((ct) => (
            <div key={ct.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
              <button 
                type="button"
                onClick={() => toggleCustomTracker(ct.id)}
                className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
              >
                {ct.value ? (
                  <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={`text-xs font-sans ${ct.value ? "text-slate-400" : "text-slate-700 font-medium"}`}>
                  {ct.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeCustomTracker(ct.id)}
                className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    const newMed: MedicationItem = {
      id: `med-${Date.now()}-${Math.random()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || (lang === "es" ? "1 tableta" : "1 pill"),
      taken: false
    };
    setMedications([...medications, newMed]);
    // Also save as template for tomorrow automatically
    onAddMedicationTemplate(newMedName.trim(), newMedDosage.trim());
    setNewMedName("");
    setNewMedDosage(lang === "es" ? "1 tableta" : "1 pill");
  };

  const toggleMed = (id: string) => {
    setMedications(medications.map((m) => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const removeMed = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sleepHours = calculateSleepDuration(bedtime, waketime);
    const updatedEntry: LogEntry = {
      date: selectedDate,
      mood,

      moodTags,
      sleepQuality,
      bedtime,
      waketime,
      sleepDuration: sleepHours,
      tookNap,
      napDuration: tookNap ? napDuration : 0,
      concentration,
      tasks,
      customTrackers,
      medications
    };
    onSave(updatedEntry);
  };

  const sleepHoursCalculated = calculateSleepDuration(bedtime, waketime);
  const totalSleepDisplay = sleepHoursCalculated + (enabledTrackers.addNapToTotalSleep && tookNap ? napDuration : 0);
  const moodLabel = getMoodLabel(mood);

  // Stats for the log sheet
  const taskCompletionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;
  
  const medsComplianceRate = medications.length > 0 
    ? Math.round((medications.filter(m => m.taken).length / medications.length) * 100) 
    : 0;

  return (
    <div id="tracking-panel" className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      {/* Panel Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 id="log-panel-title" className="font-sans font-semibold text-lg text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              {t.logSheet}
            </h2>
            {entry ? (
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                {lang === "es" ? "Registro Existente" : "Existing Log"}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                {lang === "es" ? "Nuevo Registro" : "New Log"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            {t.logSubtitle}
          </p>
        </div>
        <div className="relative">
          <input 
            type="date" 
            id="log-date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayDateString()}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          />
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6">
        
        {/* If no tracker is enabled */}
        {!enabledTrackers.mood && !enabledTrackers.sleep && !enabledTrackers.focus && !enabledTrackers.medications && !enabledTrackers.tasks && !enabledTrackers.customTrackers && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3 mb-6">
            <p className="text-xs text-amber-800 font-sans font-medium">
              {lang === "es" 
                ? "No hay variables de seguimiento seleccionadas para registrar." 
                : "No tracking variables are selected to log."}
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              {lang === "es"
                ? "Por favor, ve a la pestaña 'Configuración' y selecciona al menos una variable que deseas registrar en tu registro de bienestar diario."
                : "Please navigate to the 'Configuration' tab and select at least one variable that you want to track daily."}
            </p>
          </div>
        )}

        <div className="columns-1 md:columns-2 gap-8">

        {/* SECTION 1: MOOD TRACKER */}
        {enabledTrackers.mood && (
          <div id="tracking-section-mood" className="break-inside-avoid mb-6 md:mb-8 space-y-4 animate-fade-in bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-sm text-slate-700 flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-500" />
                {t.moodRating}
              </h3>
              <span className="text-[11px] font-semibold font-sans px-3 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                {t.rating}: {mood}/10
              </span>
            </div>

            <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50 space-y-3">
              <input 
                type="range" 
                id="mood-slider"
                min="1" 
                max="10" 
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>{t.moodStruggling}</span>
                <span className="font-sans font-medium text-slate-700 text-xs text-center">
                  {moodLabel.text}
                </span>
                <span>{t.moodRadiant}</span>
              </div>
            </div>

            {/* Feeling Tags */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block">
                {t.feelingTags}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = moodTags.includes(tag.name);
                  // Translate tag name
                  const tagTranslation = t.tags[tag.name] || tag.name;
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-sans flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                        active 
                          ? "bg-indigo-50 text-indigo-700 font-medium scale-[1.02]" 
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{tagTranslation}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {renderCustomTrackersForCategory("mood")}
          </div>
        )}

        {/* SECTION 2: SLEEP SCHEDULE */}
        {enabledTrackers.sleep && (
          <div id="tracking-section-sleep" className="break-inside-avoid mb-6 md:mb-8 space-y-4 animate-fade-in bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-sm text-slate-700 flex items-center gap-2">
                <Moon className="w-4 h-4 text-blue-500" />
                {t.sleepSchedule}
              </h3>
              <span className="text-[11px] font-semibold font-sans px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {totalSleepDisplay > 0 ? `${totalSleepDisplay} ${t.hours}` : `0.0 ${t.hours}`}
              </span>
            </div>

            <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100/40 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    {t.bedtime}
                  </label>
                  <input 
                    type="time" 
                    id="bedtime-input"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    {t.waketime}
                  </label>
                  <input 
                    type="time" 
                    id="waketime-input"
                    value={waketime}
                    onChange={(e) => setWaketime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{t.sleepQuality}: {sleepQuality}/10</span>
                </div>
                <input 
                  type="range" 
                  id="sleep-quality-slider"
                  min="1" 
                  max="10" 
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-zinc-505 italic mt-1 bg-white px-2 py-1 rounded border border-slate-100">
                  {getSleepLabel(sleepQuality)}
                </p>
              </div>

              {/* Nap Settings */}
              <div className="pt-2 border-t border-blue-100/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tookNap}
                    onChange={(e) => setTookNap(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-sans text-slate-700">
                    {(t as any).tookNap || "¿Tomaste siesta?"}
                  </span>
                </label>
                {tookNap && (
                  <div className="mt-3 pl-7 space-y-1 animate-fade-in">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                      {(t as any).napDuration || "Horas de siesta"}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={napDuration}
                      onChange={(e) => setNapDuration(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {renderCustomTrackersForCategory("sleep")}
          </div>
        )}

        {/* SECTION 3: CONCENTRATION LEVEL */}
        {enabledTrackers.focus && (
          <div id="tracking-section-focus" className="break-inside-avoid mb-6 md:mb-8 space-y-4 animate-fade-in bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-sm text-slate-700 flex items-center gap-2">
                <Brain className="w-4 h-4 text-teal-500" />
                {t.concentratingLevel}
              </h3>
              <span className="text-[11px] font-semibold font-sans px-3 py-1 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                {t.focusLabel}: {concentration}/10
              </span>
            </div>

            <div className="bg-teal-50/20 p-4 rounded-xl border border-teal-100/40 space-y-3">
              <input 
                type="range" 
                id="focus-slider"
                min="1" 
                max="10" 
                value={concentration}
                onChange={(e) => setConcentration(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>{t.distracted}</span>
                <span className="font-sans font-medium text-slate-700 text-xs text-center">
                  {getConcentrationLabel(concentration)}
                </span>
                <span>{t.flow}</span>
              </div>
            </div>

            {renderCustomTrackersForCategory("focus")}
          </div>
        )}

        {/* SECTION 4: MEDICINE INTAKE */}
        {enabledTrackers.medications && (
          <div id="tracking-section-meds" className="break-inside-avoid mb-6 md:mb-8 space-y-4 animate-fade-in bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-sm text-slate-700 flex items-center gap-2">
                <span className="text-red-500 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 21V15H3V9H9V3H15V9H21V15H15V21H9Z" />
                  </svg>
                </span>
                {t.medicineIntake}
              </h3>
              <span className="text-[11px] font-semibold font-sans px-3 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                {t.taking}: {medications.filter(m => m.taken).length}/{medications.length} ({medsComplianceRate}%)
              </span>
            </div>

            <div className="space-y-2">
              {medications.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center border border-dashed border-slate-200">
                  {t.noMeds}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <button 
                        type="button"
                        onClick={() => toggleMed(med.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {med.taken ? (
                          <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-slate-300 rounded-full shrink-0" />
                        )}
                        <div>
                          <span className={`text-xs font-sans font-medium block ${med.taken ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {med.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {med.dosage}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMed(med.id)}
                        className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove medicine log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Med */}
              <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/50 sm:flex sm:items-center">
                <input
                  type="text"
                  placeholder={t.medPlaceholder}
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="col-span-12 sm:flex-1 bg-white border border-slate-200 px-2.5 py-1.5 text-xs rounded-lg text-slate-700 font-sans focus:outline-hidden focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder={t.dosagePlaceholder}
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  className="col-span-8 sm:w-24 bg-white border border-slate-200 px-2 py-1.5 text-xs rounded-lg text-slate-700 font-sans focus:outline-hidden focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="col-span-4 sm:shrink-0 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer h-8 sm:h-7"
                  title="Add Medicine"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: DAILY TASKS */}
        {enabledTrackers.tasks && (
          <div id="tracking-section-tasks" className="break-inside-avoid mb-6 md:mb-8 space-y-4 animate-fade-in bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-sm text-slate-700 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                {t.dailyTasks}
              </h3>
              <span className="text-[11px] font-semibold font-sans px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                {t.completedRate}: {tasks.filter(t => t.completed).length}/{tasks.length} ({taskCompletionRate}%)
              </span>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center border border-dashed border-slate-200">
                  {t.allDone}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <button 
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`text-xs font-sans ${task.completed ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                          {task.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Task */}
              <div className="flex gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/50">
                <input
                  type="text"
                  placeholder={t.taskPlaceholder}
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 px-2.5 py-1 text-xs rounded-lg text-slate-700 font-sans focus:outline-hidden focus:ring-1 focus:ring-emerald-100 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* SAVE BUTTON */}
        {(enabledTrackers.mood || enabledTrackers.sleep || enabledTrackers.focus || enabledTrackers.medications || enabledTrackers.tasks || enabledTrackers.customTrackers) && (
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              id="save-log-btn"
              className="w-full md:w-auto md:min-w-[300px] bg-indigo-600 text-white py-3.5 px-8 font-sans font-medium text-sm rounded-xl cursor-pointer hover:bg-indigo-700 active:scale-[0.99] shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <CheckCircle2 className="w-5 h-5 text-indigo-100" />
              {t.saveEntryBtn}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
