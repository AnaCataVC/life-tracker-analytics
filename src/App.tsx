import React, { useState, useEffect } from "react";
import { LogEntry, EnabledTrackers } from "./types";
import { getTodayDateString, getTotalSleep, isRunningAsPWA } from "./utils/helpers";
import TrackingForm from "./components/TrackingForm";
import AnalyticsCharts from "./components/AnalyticsCharts";
import LocalInsights from "./components/LocalInsights";
import { translations } from "./utils/translations";
import { 
  loginGoogleDrive,
  backupToDrive, 
  restoreFromDrive,
  BackupData
} from "./utils/googleDrive";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./utils/db";
import { 
  Settings, 
  Trash2, 
  HelpCircle, 
  Calendar, 
  User, 
  Compass, 
  RefreshCw,
  LineChart,
  Globe,
  Database,
  Download,
  Upload,
  LogOut,
  Info,
  AlertTriangle,
  Plus,
  Sparkles,
  SlidersHorizontal,
  Activity,
  Award,
  Pencil,
  Brain,
  Sun,
  Moon,
  Smile,
  CheckSquare
} from "lucide-react";

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<"en" | "es">("es");

  // 2. Theme state: light or high-contrast dark
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("wellbeing_theme");
      if (saved === "dark" || saved === "light") {
        return saved;
      }
    } catch (e) {
      console.error("Error reading theme preference:", e);
    }
    return "light";
  });

  // Main states
  const historyLogs = useLiveQuery(() => db.logs.toArray()) || [];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // Custom templates to auto-preload medications on new logs
  const [medicationTemplate, setMedicationTemplate] = useState<{ name: string; dosage: string }[]>(
    []
  );

  // Custom templates to auto-preload daily habits as checklist items on new logs
  const [habitsTemplate, setHabitsTemplate] = useState<{ name: string }[]>(() => {
    try {
      const saved = localStorage.getItem("wellbeing_habits_template");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading habits template:", e);
    }
    return [];
  });

  const [activeSectionTab, setActiveSectionTab] = useState<"register" | "stats" | "correlations" | "config">("register");
  const [enabledTrackers, setEnabledTrackers] = useState<EnabledTrackers>(() => {
    try {
      const saved = localStorage.getItem("wellbeing_enabled_trackers");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading enabled trackers:", e);
    }
    return {
      mood: true,
      sleep: true,
      focus: true,
      medications: true,
      tasks: true
    };
  });

  useEffect(() => {
    localStorage.setItem("wellbeing_enabled_trackers", JSON.stringify(enabledTrackers));
  }, [enabledTrackers]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Sheets integration state variables
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
    return localStorage.getItem("wellbeing_google_token") || null;
  });
  const [googleUser, setGoogleUser] = useState<{ email: string; name?: string; picture?: string } | null>(() => {
    const saved = localStorage.getItem("wellbeing_google_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [detectedClientId, setDetectedClientId] = useState<string>("");
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem("wellbeing_google_client_id") || "";
  });
  const [sheetId, setSheetId] = useState<string>(() => {
    return localStorage.getItem("wellbeing_spreadsheet_id") || "";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSheetsConfig, setShowSheetsConfig] = useState<boolean>(false);
  const [showPurposeBanner, setShowPurposeBanner] = useState<boolean>(() => {
    return localStorage.getItem("wellbeing_hide_purpose") !== "true";
  });

  const dismissPurposeBanner = () => {
    setShowPurposeBanner(false);
    localStorage.setItem("wellbeing_hide_purpose", "true");
  };
  // PWA state variables
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState<boolean>(false);

  // Dynamic user profile fetching helper
  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userInfo = {
          email: data.email || "",
          name: data.name || "Life Tracker & Analytics",
          picture: data.picture || undefined
        };
        setGoogleUser(userInfo);
        localStorage.setItem("wellbeing_google_user", JSON.stringify(userInfo));
      }
    } catch (e) {
      console.error("Error fetching Google profile:", e);
    }
  };


  // Synchronize theme with document class list
  useEffect(() => {
    try {
      localStorage.setItem("wellbeing_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Error toggling root theme:", e);
    }
  }, [theme]);


  // Load language and data from localStorage on component mount
  useEffect(() => {
    const savedLang = localStorage.getItem("wellbeing_app_lang") as "en" | "es" | null;
    if (savedLang) {
      setLang(savedLang);
    } else {
      // Determine if browser preferred language is Spanish
      try {
        if (navigator.language?.toLowerCase().startsWith("es")) {
          setLang("es");
        } else {
          setLang("en");
        }
      } catch (e) {
        setLang("es");
      }
    }

    const savedLogs = localStorage.getItem("wellbeing_history_logs");
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        if (logs && logs.length > 0) {
          db.logs.bulkPut(logs).then(() => {
            localStorage.removeItem("wellbeing_history_logs");
          });
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }

    const savedMeds = localStorage.getItem("wellbeing_meds_template");
    const savedHabits = localStorage.getItem("wellbeing_habits_template");

    if (savedMeds) {
      try {
        const parsedMeds = JSON.parse(savedMeds);
        // Clear if it matches the old defaults
        if (parsedMeds.length > 0 && parsedMeds[0].name === "Multivitamin") {
          localStorage.removeItem("wellbeing_meds_template");
        } else {
          setMedicationTemplate(parsedMeds);
        }
      } catch (e) {}
    }

    if (savedHabits) {
      try {
        const parsedHabits = JSON.parse(savedHabits);
        // Clear if it matches the old defaults
        if (parsedHabits.length > 0 && parsedHabits[0].name.includes("Beber 2 litros")) {
          localStorage.removeItem("wellbeing_habits_template");
        } else {
          setHabitsTemplate(parsedHabits);
        }
      } catch (e) {}
    }
  }, []);

  // Check PWA and handle install prompt
  useEffect(() => {
    setIsPWA(isRunningAsPWA());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Quick notifier trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Google Sheets sync actions
  const handleConnectGoogle = async () => {
    const activeClientId = customClientId || detectedClientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!activeClientId) {
      triggerToast(lang === "es" 
        ? "Por favor, ingresa tu Google Client ID en la configuración para continuar." 
        : "Please enter your Google Client ID under setup to keep going."
      );
      setShowSheetsConfig(true);
      return;
    }
    try {
      const token = await loginGoogleDrive(activeClientId);
      setGoogleToken(token);
      localStorage.setItem("wellbeing_google_token", token);
      triggerToast(lang === "es" ? "Conectado a Google exitosamente! 🎉" : "Connected to Google successfully! 🎉");
      await fetchUserProfile(token);
    } catch (err: any) {
      console.error(err);
      triggerToast(lang === "es" ? `Error de autenticación: ${err.message}` : `Authentication error: ${err.message}`);
    }
  };



  const handleUploadToDrive = async (customLogs?: LogEntry[]) => {
    const logsToSync = customLogs || historyLogs;
    if (!googleToken) return;
    
    setIsSyncing(true);
    try {
      const backupData: BackupData = {
        version: 2,
        logs: logsToSync,
        templates: {
          medications: medicationTemplate,
          habits: habitsTemplate
        },
        config: {
          theme,
          enabledTrackers,
          appLang: lang
        }
      };
      await backupToDrive(googleToken, backupData);
      triggerToast(lang === "es" ? "¡Respaldo guardado en Google Drive! 🚀" : "Backup uploaded to Google Drive! 🚀");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("expired")) {
        setGoogleToken(null);
        setGoogleUser(null);
        triggerToast(lang === "es" ? "Sesión de Google expirada, conéctate de nuevo." : "Google session expired. Please connect again.");
      } else {
        triggerToast(lang === "es" ? `Error al subir: ${err.message}` : `Sync error: ${err.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromDrive = async () => {
    if (!googleToken) return;
    const confirmMsg = lang === "es"
      ? "¿Estás seguro que deseas descargar el respaldo de Google Drive? Esto puede sobrescribir tus registros locales actuales."
      : "Are you sure you want to download logs from Google Drive? This might overwrite some of your current local logs.";
    if (window.confirm(confirmMsg)) {
      setIsSyncing(true);
      try {
        const pulled = await restoreFromDrive(googleToken);
        const backupData = pulled as BackupData;
        
        if (backupData.logs) await db.logs.bulkPut(backupData.logs);
        
        if (backupData.templates) {
          if (backupData.templates.medications) {
            setMedicationTemplate(backupData.templates.medications);
            localStorage.setItem("wellbeing_meds_template", JSON.stringify(backupData.templates.medications));
          }
          if (backupData.templates.habits) {
            setHabitsTemplate(backupData.templates.habits);
            localStorage.setItem("wellbeing_habits_template", JSON.stringify(backupData.templates.habits));
          }
        }
        
        if (backupData.config) {
          if (backupData.config.theme) setTheme(backupData.config.theme as "light" | "dark");
          if (backupData.config.enabledTrackers) setEnabledTrackers(backupData.config.enabledTrackers);
          if (backupData.config.appLang) setLang(backupData.config.appLang as "en" | "es");
        }

        triggerToast(lang === "es" ? `¡Se recuperaron ${backupData.logs.length} registros y configuración! 📥` : `Successfully recovered ${backupData.logs.length} logs and config! 📥`);
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("expired")) {
          setGoogleToken(null);
          setGoogleUser(null);
          triggerToast(lang === "es" ? "Sesión de Google expirada, conéctate de nuevo." : "Google session expired. Please connect again.");
        } else {
          triggerToast(lang === "es" ? `Error al descargar: ${err.message}` : `Download error: ${err.message}`);
        }
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleToken(null);
    setGoogleUser(null);
    localStorage.removeItem("wellbeing_google_token");
    localStorage.removeItem("wellbeing_google_user");
    triggerToast(lang === "es" ? "Desconectado de Google." : "Disconnected from Google.");
  };

  // Toggle language and update state & storage
  const handleToggleLang = (selected: "en" | "es") => {
    setLang(selected);
    localStorage.setItem("wellbeing_app_lang", selected);
    // Dynamic welcome alert for language switch
    const switchMsg = selected === "es" 
      ? "Idioma cambiado a Español" 
      : "Language switched to English";
    triggerToast(switchMsg);
  };

  const t = translations[lang];

  // Save log entry when modified or created
  const handleSaveEntry = async (updatedEntry: LogEntry, skipConfirm: boolean = false) => {
    if (!skipConfirm && historyLogs && historyLogs.some(l => l.date === updatedEntry.date)) {
      if (!window.confirm(t.overwriteConfirm)) {
        return;
      }
    }

    await db.logs.put(updatedEntry);
    triggerToast(`${t.toastSaved} ${updatedEntry.date}!`);

    // Fully automated background sync upon saving logs!
    if (googleToken) {
      setIsSyncing(true);
      try {
        const currentLogs = await db.logs.toArray();
        const backupData: BackupData = {
          version: 2,
          logs: currentLogs,
          templates: {
            medications: medicationTemplate,
            habits: habitsTemplate
          },
          config: {
            theme,
            enabledTrackers,
            appLang: lang
          }
        };
        await backupToDrive(googleToken, backupData);
        triggerToast(lang === "es" 
          ? "🔄 ¡Respaldo automático en Google Drive!" 
          : "🔄 Automatically backed up to Google Drive!"
        );
      } catch (err: any) {
        console.error("Autosave background error:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Add medication to general template
  const handleAddMedicationTemplate = (name: string, dosage: string) => {
    const exists = medicationTemplate.some(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      const updatedTemplate = [...medicationTemplate, { name, dosage }];
      setMedicationTemplate(updatedTemplate);
      localStorage.setItem("wellbeing_meds_template", JSON.stringify(updatedTemplate));
      triggerToast(lang === "es" ? "Medicamento añadido a la plantilla!" : "Medication added to template!");
    } else {
      triggerToast(lang === "es" ? "Este medicamento ya existe en la plantilla." : "This medication is already in the template.");
    }
  };

  // Remove medication from general template
  const handleRemoveMedicationTemplate = (index: number) => {
    const updated = medicationTemplate.filter((_, i) => i !== index);
    setMedicationTemplate(updated);
    localStorage.setItem("wellbeing_meds_template", JSON.stringify(updated));
    triggerToast(lang === "es" ? "Medicamento eliminado de la lista." : "Medication removed from template.");
  };

  // Add daily habit template fallback
  const handleAddHabitTemplate = (name: string) => {
    const exists = habitsTemplate.some(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      const updatedTemplate = [...habitsTemplate, { name }];
      setHabitsTemplate(updatedTemplate);
      localStorage.setItem("wellbeing_habits_template", JSON.stringify(updatedTemplate));
      triggerToast(lang === "es" ? "Hábito añadido a la plantilla!" : "Habit added to core templates!");
    } else {
      triggerToast(lang === "es" ? "Este hábito ya existe en la plantilla." : "This habit is already in your templates.");
    }
  };

  // Remove daily habit template fallback
  const handleRemoveHabitTemplate = (index: number) => {
    const updated = habitsTemplate.filter((_, i) => i !== index);
    setHabitsTemplate(updated);
    localStorage.setItem("wellbeing_habits_template", JSON.stringify(updated));
    triggerToast(lang === "es" ? "Hábito eliminado de la lista de plantillas." : "Habit removed from template.");
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (window.confirm(t.eraserConfirm)) {
      await db.logs.clear();
      triggerToast(t.allCleared);
    }
  };

  // Delete specific log
  const handleDeleteSpecificDay = async (date: string) => {
    const confirmMessage = lang === "es" 
      ? `¿Estás seguro de que quieres borrar el registro del día ${date}?`
      : `Are you sure you want to delete the log for ${date}?`;
    if (window.confirm(confirmMessage)) {
      await db.logs.delete(date);
      triggerToast(lang === "es" ? "Registro borrado." : "Log deleted.");
    }
  };

  // Commit an offline dynamic suggested habit as a recurring checklist task for Today
  const handleCommitHabit = (habitName: string) => {
    const today = getTodayDateString();
    const todayLog = historyLogs.find((l) => l.date === today);

    if (todayLog) {
      const exists = todayLog.tasks.some(
        (t) => t.name.toLowerCase() === habitName.toLowerCase()
      );
      if (!exists) {
        const newTask = {
          id: `task-commit-${Date.now()}`,
          name: habitName,
          completed: false
        };
        const updatedToday = {
          ...todayLog,
          tasks: [...todayLog.tasks, newTask]
        };
        handleSaveEntry(updatedToday, true);
      } else {
        triggerToast(t.habitExists);
      }
    } else {
      // Create template today log with this task pre-added!
      const defaultToday: LogEntry = {
        date: today,
        mood: 7,
        moodTags: ["calm"],
        sleepQuality: 7,
        bedtime: "22:30",
        waketime: "07:00",
        sleepDuration: 8.5,
        concentration: 7,
        tasks: [
          ...habitsTemplate.map((h, i) => ({
            id: `template-task-${i}-${Date.now()}`,
            name: h.name,
            completed: false
          })),
          { id: `task-commit-${Date.now()}`, name: habitName, completed: false }
        ],
        medications: medicationTemplate.map((m, idx) => ({
          id: `med-pre-${idx}-${Date.now()}`,
          name: m.name,
          dosage: m.dosage,
          taken: false
        }))
      };
      handleSaveEntry(defaultToday, true);
    }

    triggerToast(`${lang === "es" ? "Hábito añadido:" : "Added habit:"} "${habitName}"!`);
    
    // Scroll smoothly to tracking panel
    const p = document.getElementById("tracking-panel");
    if (p) {
      p.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Retrieve selected log entry or fallback to undefined
  const activeLogEntry = historyLogs.find((log) => log.date === selectedDate);

  // Calculate missing dates
  const missingDates = React.useMemo(() => {
    if (historyLogs.length === 0) return [];
    
    const sortedLogs = [...historyLogs].sort((a, b) => a.date.localeCompare(b.date));
    const firstDateStr = sortedLogs[0].date;
    const todayStr = getTodayDateString();
    
    const firstDate = new Date(firstDateStr + "T00:00:00");
    const todayDate = new Date(todayStr + "T00:00:00");
    
    const missing: string[] = [];
    const existingDates = new Set(historyLogs.map(l => l.date));
    
    const currentDate = new Date(firstDate);
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (currentDate <= todayDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      if (!existingDates.has(dateStr)) {
        missing.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return missing.sort((a, b) => b.localeCompare(a));
  }, [historyLogs]);

  // Brief dynamic statistical calculations for global display widgets
  const trackedDaysCount = historyLogs.length;
  const moodList = historyLogs.map((l) => l.mood);
  const averageMoodValue = moodList.length > 0 
    ? (moodList.reduce((a, b) => a + b, 0) / moodList.length).toFixed(1) 
    : "0.0";

  const sleepDurList = historyLogs.map((l) => getTotalSleep(l, enabledTrackers) || 0);
  const averageSleepDuration = sleepDurList.length > 0
    ? (sleepDurList.reduce((a, b) => a + b, 0) / sleepDurList.length).toFixed(1)
    : "0.0";

  const sleepQualList = historyLogs.map((l) => l.sleepQuality || 0);
  const averageSleepQuality = sleepQualList.length > 0
    ? (sleepQualList.reduce((a, b) => a + b, 0) / sleepQualList.length).toFixed(1)
    : "0.0";

  const focusList = historyLogs.map((l) => l.concentration || 0);
  const averageFocusValue = focusList.length > 0
    ? (focusList.reduce((a, b) => a + b, 0) / focusList.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-indigo-100 selection:text-indigo-850 dark:bg-slate-950 dark:text-slate-300 pb-24 md:pb-6">
      
      {/* Visual Header Grid & Branding */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs dark:bg-slate-900/90 dark:border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img src="/lta_icon_850x850.png" alt="Life Tracker Analytics" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <h1 className="font-outfit font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-50 tracking-tight truncate">
                {t.title}
              </h1>
            </div>
          </div>

          {/* Desktop/Tablet Sticky Navigation inside standard Header */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 dark:bg-slate-800 dark:border-slate-700/80">
            <button
              onClick={() => setActiveSectionTab("register")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSectionTab === "register"
                  ? "bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200/50 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/50"
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{lang === "es" ? "Registro" : "Register"}</span>
            </button>
            <button
              onClick={() => setActiveSectionTab("stats")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSectionTab === "stats"
                  ? "bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200/50 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/50"
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{lang === "es" ? "Estadísticas" : "Stats"}</span>
            </button>
            <button
              onClick={() => setActiveSectionTab("correlations")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSectionTab === "correlations"
                  ? "bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200/50 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                  : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{lang === "es" ? "Análisis" : "Analysis"}</span>
            </button>
            <button
              onClick={() => setActiveSectionTab("config")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSectionTab === "config"
                  ? "bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200/50 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
                  : "text-slate-500 hover:text-slate-855 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-700/50"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{lang === "es" ? "Ajustes" : "Settings"}</span>
            </button>
          </div>

          {/* Quick Settings Shortcut on mobile header */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setActiveSectionTab("config")}
              className={`p-2.5 border rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                activeSectionTab === "config"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/45 dark:border-indigo-800 dark:text-indigo-400"
                  : "border-slate-200/70 text-slate-600 hover:text-slate-850 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-250 dark:hover:bg-slate-900"
              }`}
              title={lang === "es" ? "Configuración" : "Configuration"}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Solid Bottom Navigation Bar strictly for Mobile Views */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800/80 py-2.5 px-3 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveSectionTab("register")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer ${
            activeSectionTab === "register"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold scale-105"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <Pencil className={`w-4.5 h-4.5 mb-1 ${activeSectionTab === "register" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[10px] select-none">{lang === "es" ? "Registro" : "Register"}</span>
        </button>

        <button
          onClick={() => setActiveSectionTab("stats")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer ${
            activeSectionTab === "stats"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold scale-105"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <LineChart className={`w-4.5 h-4.5 mb-1 ${activeSectionTab === "stats" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[10px] select-none">{lang === "es" ? "Estadísticas" : "Stats"}</span>
        </button>

        <button
          onClick={() => setActiveSectionTab("correlations")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer ${
            activeSectionTab === "correlations"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold scale-105"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <Sparkles className={`w-4.5 h-4.5 mb-1 ${activeSectionTab === "correlations" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[10px] select-none">{lang === "es" ? "Análisis" : "Analysis"}</span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* APP PURPOSE BANNER (Required for Google Verification) */}
        {showPurposeBanner && (
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 sm:p-5 flex gap-4 animate-fade-in shadow-sm relative pr-10">
            <button 
              onClick={dismissPurposeBanner}
              className="absolute top-3 right-3 p-1.5 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 transition-colors rounded-lg hover:bg-indigo-100/50 dark:hover:bg-indigo-800/50 cursor-pointer"
              title={lang === "es" ? "Ocultar mensaje" : "Dismiss message"}
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-indigo-900 dark:text-indigo-100 font-sans text-sm sm:text-base">
                {lang === "es" ? "Bienvenido a Life Tracker Analytics" : "Welcome to Life Tracker Analytics"}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-700/80 dark:text-indigo-300/80 font-sans mt-1.5 leading-relaxed">
                {lang === "es" 
                  ? "El propósito de esta aplicación es ayudarte a registrar tus hábitos diarios, estado de ánimo, rutinas y calidad de sueño. Todos los datos se almacenan y analizan localmente en tu dispositivo para ofrecerte estadísticas personalizadas sobre tu bienestar."
                  : "The purpose of this application is to help you track your daily habits, mood, routines, and sleep quality. All data is stored and analyzed locally on your device to provide personalized statistics about your well-being."}
              </p>
            </div>
          </div>
        )}
        {/* PWA INSTALL BANNER */}
        {!isPWA && deferredPrompt && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg mb-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold font-sans">
                  {lang === "es" ? "Instala la aplicación" : "Install the app"}
                </p>
                <p className="text-xs text-indigo-100 font-sans mt-0.5">
                  {lang === "es" ? "Acceso rápido y experiencia sin conexión." : "Quick access and better offline experience."}
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{lang === "es" ? "Instalar" : "Install"}</span>
            </button>
          </div>
        )}

        {/* TOAST SYSTEM ALERTS */}
        {toastMessage && (
          <div className="fixed bottom-24 right-5 z-50 bg-indigo-900 text-slate-100 px-4 py-3 rounded-lg text-xs font-sans shadow-lg flex items-center justify-between border border-indigo-950 animate-bounce">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {toastMessage}
            </span>
          </div>
        )}

        {/* TAB 1 CONTENT: DYNAMIC TRACKING FORM & TIMELINE */}
        {activeSectionTab === "register" && (
          <div className="flex flex-col gap-6 animate-fade-in text-slate-700">
            
            {/* ROW 1: Daily Log Form Sheet (Full Width) */}
            <div className="w-full">
              <TrackingForm 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                entry={activeLogEntry}
                onSave={handleSaveEntry}
                medicationTemplate={medicationTemplate}
                onAddMedicationTemplate={handleAddMedicationTemplate}
                habitsTemplate={habitsTemplate}
                onAddHabitTemplate={handleAddHabitTemplate}
                lang={lang}
                enabledTrackers={enabledTrackers}
              />
            </div>

            {/* ROW 2: Helper Info and Missing Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              
              {/* MISSING LOGS CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-xs text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    {lang === "es" ? "Días sin Registro" : "Missing Logs"}
                  </h3>
                  <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
                    {missingDates.length} {lang === "es" ? "PENDIENTES" : "PENDING"}
                  </span>
                </div>

                {missingDates.length === 0 ? (
                  <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 text-center space-y-2.5 animate-fade-in select-none">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-sans font-bold text-slate-800">
                        {lang === "es" ? "¡Todo al día!" : "All caught up!"}
                      </p>
                      <p className="text-[11px] font-sans text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                        {lang === "es"
                          ? "Has registrado todos los días desde que comenzaste."
                          : "You have tracked every day since you started."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    {missingDates.map((date) => (
                      <div
                        key={date}
                        className="w-full p-3 rounded-xl border border-rose-100/50 bg-rose-50/30 flex items-center justify-between text-left transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-700">
                            {date} {date === getTodayDateString() ? (lang === "es" ? "(Hoy)" : "(Today)") : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDate(date);
                            const p = document.getElementById("tracking-panel");
                            if (p) p.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Pencil className="w-3 h-3" />
                          {lang === "es" ? "Completa aquí" : "Complete here"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HELPER QUICK-GUIDE INFOBAR */}
              <div className="bg-indigo-50/15 border border-indigo-100/50 rounded-2xl p-6 flex items-start gap-4">
                <span className="w-9 h-9 shrink-0 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <div className="space-y-1.5">
                  <h4 className="font-sans font-semibold text-xs text-slate-900 uppercase tracking-widest">
                    {t.helperTitle}
                  </h4>
                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    {t.helperSubtitle}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 font-sans pt-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      {t.helperList1}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      {t.helperList2}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      {t.helperList3}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      {t.helperList4}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 CONTENT: GENERAL STATISTICS METRICS & CHARTS */}
        {activeSectionTab === "stats" && (
          <div className="space-y-6 animate-fade-in text-slate-700">
            
            {/* INLINE TOP STATISTICS CARDS RIBBON */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Mood */}
              {enabledTrackers.mood && (
                <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-3.5">
                  <span className="w-9 h-9 rounded-lg bg-amber-50/50 flex items-center justify-center text-amber-500 shrink-0">
                    <Smile className="w-4 h-4 text-amber-500" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-bold">
                      {t.averageMood}
                    </span>
                    <span className="text-sm font-sans font-bold text-slate-800 block mt-0.5">
                      {averageMoodValue} / 10
                    </span>
                  </div>
                </div>
              )}

              {/* Card 2: Sleep */}
              {enabledTrackers.sleep && (
                <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-3.5">
                  <span className="w-9 h-9 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-500 shrink-0">
                    <Moon className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-bold">
                      {lang === "es" ? "Sueño Promedio" : "Average Sleep"}
                    </span>
                    <span className="text-sm font-sans font-bold text-slate-800 block mt-0.5">
                      {averageSleepQuality} / 10 <span className="text-[10px] text-slate-400 font-normal">({averageSleepDuration}h)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Card 3: Focus */}
              {enabledTrackers.focus && (
                <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-3.5">
                  <span className="w-9 h-9 rounded-lg bg-teal-50/50 flex items-center justify-center text-teal-500 shrink-0">
                    <Brain className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-bold">
                      {lang === "es" ? "Enfoque Promedio" : "Average Focus"}
                    </span>
                    <span className="text-sm font-sans font-bold text-slate-800 block mt-0.5">
                      {averageFocusValue} / 10
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CHARTS COMPONENT */}
            <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-2xs">
              <AnalyticsCharts history={historyLogs} lang={lang} mode="stats" theme={theme} enabledTrackers={enabledTrackers} />
            </div>
          </div>
        )}

        {/* TAB 3 CONTENT: RELATIONSHIPS BETWEEN DIFFERENT VARIABLES */}
        {activeSectionTab === "correlations" && (
          <div className="space-y-6 animate-fade-in">
            {/* VISUAL CORRELATIONS CHART */}
            <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-2xs">
              <AnalyticsCharts history={historyLogs} lang={lang} mode="correlations" theme={theme} enabledTrackers={enabledTrackers} />
            </div>

            {/* HEURISTIC LOCAL ADVISOR SUMMARY */}
            <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-2xs">
              <LocalInsights 
                history={historyLogs} 
                googleName={googleUser?.name} 
                onCommitHabit={handleCommitHabit}
                lang={lang}
                enabledTrackers={enabledTrackers}
              />
            </div>
          </div>
        )}

        {/* TAB 4 CONTENT: CONFIGURATION SECTION PANEL */}
        {activeSectionTab === "config" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in text-slate-700">
            
            <div className="space-y-6">
              
              {/* 1. LANGUAGE & THEME PREFERENCES */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {lang === "es" ? "Idioma y Tema Visual" : "Language & Visual Theme"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {lang === "es"
                    ? "Elige tu idioma preferido y personaliza el aspecto visual de la aplicación para mayor legibilidad y comodidad."
                    : "Select your preferred language and customize the application's appearance for better readability and style."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Language choice */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold block">
                      {lang === "es" ? "Idioma de la Interfaz" : "Interface Language"}
                    </label>
                    <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleToggleLang("es")}
                        className={`flex-1 py-1.5 text-xs font-sans rounded-lg font-bold transition-all cursor-pointer text-center ${
                          lang === "es"
                            ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {lang === "es" ? "Español (ES)" : "Spanish (ES)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleLang("en")}
                        className={`flex-1 py-1.5 text-xs font-sans rounded-lg font-bold transition-all cursor-pointer text-center ${
                          lang === "en"
                            ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {lang === "es" ? "Inglés (EN)" : "English (EN)"}
                      </button>
                    </div>
                  </div>

                  {/* Theme choice */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold block">
                      {lang === "es" ? "Aspecto de Interfaz" : "Visual Theme"}
                    </label>
                    <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`flex-1 py-1.5 text-xs font-sans rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          theme === "light"
                            ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        {lang === "es" ? "Claro" : "Light"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`flex-1 py-1.5 text-xs font-sans rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          theme === "dark"
                            ? "bg-white text-indigo-600 shadow-3xs border border-slate-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        {lang === "es" ? "Oscuro" : "Dark"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SELECT WHAT TO TRACK */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {lang === "es" ? "Selección de lo que se va a registrar" : "Select Variables to Track"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {lang === "es"
                    ? "Activa o desactiva qué secciones prefieres registrar a diario. La ficha de registro se reorganizará de forma automática."
                    : "Toggle which wellness aspects you want to track daily. Your log sheet will adjust dynamically based on your filters."}
                </p>

                <div className="space-y-2 pt-1">
                  
                  {/* Mood Rating Switch */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
                        <Smile className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {lang === "es" ? "Estado de Ánimo y Etiquetas" : "Mood rating & Tags"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                          {lang === "es" ? "Escala 1 al 10 y etiquetas de estado de ánimo." : "1-10 slider scores with mood tags."}
                        </span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enabledTrackers.mood}
                      onChange={(e) => setEnabledTrackers({ ...enabledTrackers, mood: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Sleep tracking Switch */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                          <Moon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {lang === "es" ? "Horario y Calidad de Sueño" : "Sleep schedule & Quality"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                            {lang === "es" ? "Horas de sueño estimadas y calidad de descanso." : "Calculated rest duration, bedtime clocks & score."}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enabledTrackers.sleep}
                        onChange={(e) => setEnabledTrackers({ ...enabledTrackers, sleep: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer shrink-0"
                      />
                    </label>

                    {enabledTrackers.sleep && (
                      <label className="flex items-center justify-between p-3 ml-6 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {t.addNapConfigTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                              {t.addNapConfigDesc}
                            </span>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={!!enabledTrackers.addNapToTotalSleep}
                          onChange={(e) => setEnabledTrackers({ ...enabledTrackers, addNapToTotalSleep: e.target.checked })}
                          className="w-4 h-4 accent-blue-500 rounded cursor-pointer shrink-0"
                        />
                      </label>
                    )}
                  </div>

                  {/* Focus tracking Switch */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {lang === "es" ? "Nivel de Enfoque y Productividad" : "Concentrating level"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                          {lang === "es" ? "Niveles de atención, estado de flow y distracción." : "Productivity, concentration sliders & clarity scale."}
                        </span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enabledTrackers.focus}
                      onChange={(e) => setEnabledTrackers({ ...enabledTrackers, focus: e.target.checked })}
                      className="w-4 h-4 accent-teal-500 rounded cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Medications tracking Switch */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 21V15H3V9H9V3H15V9H21V15H15V21H9Z" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {lang === "es" ? "Toma de Medicamentos" : "Medicine intake checklist"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                          {lang === "es" ? "Chequeo de medicamentos y suplementos." : "Comply vitamins, tablets or therapy trackings."}
                        </span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enabledTrackers.medications}
                      onChange={(e) => setEnabledTrackers({ ...enabledTrackers, medications: e.target.checked })}
                      className="w-4 h-4 accent-rose-500 rounded cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Habits task tracking Switch */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {lang === "es" ? "Hábitos y Rutinas Diarias" : "Routines and Habits"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                          {lang === "es" ? "Cumplimento de objetivos diarios." : "Checklist of daily positive tasks."}
                        </span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enabledTrackers.tasks}
                      onChange={(e) => setEnabledTrackers({ ...enabledTrackers, tasks: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                    />
                  </label>

                </div>
              </div>

              {/* 5. DATA MANAGEMENT */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {lang === "es" ? "Gestión de Datos" : "Data Management"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {lang === "es"
                    ? "Borra registros específicos o todo tu historial de bienestar."
                    : "Delete specific records or your entire well-being history."}
                </p>

                <div className="space-y-4 pt-1">
                  {/* Delete specific day dropdown & button */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold block">
                      {lang === "es" ? "Borrar día específico" : "Delete specific day"}
                    </label>
                    <div className="flex gap-2">
                      <select id="delete-specific-date" className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden">
                        <option value="">{lang === "es" ? "Selecciona un día..." : "Select a day..."}</option>
                        {[...historyLogs].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                          <option key={log.date} value={log.date}>{log.date}</option>
                        ))}
                      </select>
                      <button onClick={() => {
                        const d = (document.getElementById("delete-specific-date") as HTMLSelectElement).value;
                        if(d) handleDeleteSpecificDay(d);
                      }} className="px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs rounded-lg cursor-pointer shrink-0 transition-colors">
                        {lang === "es" ? "Borrar" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* Clear all history */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={handleClearAllData}
                      className="w-full py-2.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.eraserAll}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-6">
              
              {/* 3. PLANTILLA DE MEDICAMENTOS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 21V15H3V9H9V3H15V9H21V15H15V21H9Z" />
                    </svg>
                  </span>
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {lang === "es" ? "Plantilla preestablecida de Medicamentos" : "Medications Core Templates"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {lang === "es"
                    ? "Gestiona los medicamentos y suplementos habituales que tomas. Se añadirán en blanco automáticamente para cada nueva entrada."
                    : "Manage medications or supplements templates. They will automatically preload to the log grid on new days."}
                </p>

                {medicationTemplate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    {lang === "es" ? "No hay medicamentos guardados en la plantilla." : "No core template medications configured."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {medicationTemplate.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="min-w-0">
                          <span className="text-xs font-sans font-semibold text-slate-800 block truncate">
                            {med.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {lang === "es" ? `Dosis: ${med.dosage}` : `Dosage: ${med.dosage}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationTemplate(index)}
                          className="text-slate-300 hover:text-red-500 p-1 cursor-pointer transition-colors shrink-0"
                          title="Delete medication template preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Core Medication Form */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-semibold text-center sm:text-left">
                    {lang === "es" ? "Agregar a la Plantilla Básica" : "Add Core Template Medication"}
                  </span>
                  <div className="flex gap-2">
                    <input
                      id="config-med-name"
                      type="text"
                      placeholder={lang === "es" ? "Suplemento o fórmula" : "Supplement or medicine"}
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden"
                    />
                    <input
                      id="config-med-dosage"
                      type="text"
                      placeholder={lang === "es" ? "Dosis (ej. 1 tableta)" : "Dosage (e.g. 1 pill)"}
                      className="w-28 px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-mono text-slate-700 focus:outline-hidden"
                    />
                    <button
                      onClick={() => {
                        const nameBox = document.getElementById("config-med-name") as HTMLInputElement;
                        const doseBox = document.getElementById("config-med-dosage") as HTMLInputElement;
                        if (nameBox && doseBox && nameBox.value.trim()) {
                          handleAddMedicationTemplate(nameBox.value.trim(), doseBox.value.trim() || "1 pill");
                          nameBox.value = "";
                          doseBox.value = "";
                        } else {
                          triggerToast(lang === "es" ? "Por favor ingresa un nombre." : "Please enter a drug name.");
                        }
                      }}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3b. PLANTILLA DE HÁBITOS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-sans font-bold text-sm text-slate-800">
                    {lang === "es" ? "Plantilla preestablecida de Hábitos" : "Habits Core Templates"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {lang === "es"
                    ? "Gestiona los hábitos y rutinas diarias que deseas completar. Se añadirán en blanco automáticamente para cada nueva entrada."
                    : "Manage your custom recurring daily habits. They will automatically preload to your task list on new days."}
                </p>

                {habitsTemplate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    {lang === "es" ? "No hay hábitos guardados en la plantilla." : "No core template habits configured."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {habitsTemplate.map((habit, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs font-sans font-semibold text-slate-800 block truncate">
                          {habit.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHabitTemplate(index)}
                          className="text-slate-300 hover:text-red-500 p-1 cursor-pointer transition-colors shrink-0"
                          title="Delete habit template preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Core Habit Form */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-semibold text-center sm:text-left">
                    {lang === "es" ? "Agregar a la Plantilla de Hábitos" : "Add Core Template Habit"}
                  </span>
                  <div className="flex gap-2">
                    <input
                      id="config-habit-name"
                      type="text"
                      placeholder={lang === "es" ? "Ej. Meditar 10 minutos" : "e.g. Meditate 10 minutes"}
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-sans text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const nameBox = document.getElementById("config-habit-name") as HTMLInputElement;
                        if (nameBox && nameBox.value.trim()) {
                          handleAddHabitTemplate(nameBox.value.trim());
                          nameBox.value = "";
                        } else {
                          triggerToast(lang === "es" ? "Por favor ingresa un nombre." : "Please enter a habit name.");
                        }
                      }}
                      className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. GOOGLE SHEETS CONNECTION */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-3xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-500" />
                      {lang === "es" ? "Respaldo en Google Drive" : "Google Drive Backup"}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      {lang === "es"
                        ? "Respalda tus registros de bienestar de forma local e instantánea, y sincroniza automáticamente un archivo seguro en tu Google Drive."
                        : "Backup your wellness records locally and instantly, and automatically sync a secure file to your Google Drive."}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/40 p-2 rounded-lg font-sans leading-relaxed mt-2 border border-indigo-100/50 dark:border-indigo-800/50">
                      {lang === "es"
                        ? "💡 Recomendado: Te protege de perder datos si borras el caché del navegador y te permite usar la app en múltiples dispositivos."
                        : "💡 Recommended: Protects against accidental browser cache clears and allows you to use the app across multiple devices."}
                    </p>
                  </div>

                  {!googleToken ? (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={isSyncing}
                      className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-sans text-xs font-semibold shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                      )}
                      <span>
                        {isSyncing ? "..." : (lang === "es" ? "Acceder con Google" : "Sign in with Google")}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      {googleUser && (
                        <div className="flex items-center gap-1.5 mr-1 text-right hidden sm:block">
                          <span className="text-xs font-sans font-semibold text-slate-800 block">
                            {googleUser.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans block leading-none">
                            {googleUser.email}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        className="py-1.5 px-3 border border-slate-100 hover:border-slate-200 rounded-lg text-[10px] font-sans text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      >
                        {lang === "es" ? "Salir" : "Sign out"}
                      </button>
                    </div>
                  )}
                </div>

                {googleToken && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-3.5 text-xs font-sans animate-fade-in">
                    <p className="text-slate-500 text-[11px]">
                      {lang === "es" 
                        ? "Tus datos se guardan ultrarrápido en tu dispositivo. El respaldo creará un archivo \`lifetracker_backup.json\` en tu Google Drive."
                        : "Your data is saved ultra-fast locally. The backup will create a \`lifetracker_backup.json\` file in your Google Drive."}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleUploadToDrive()}
                        disabled={isSyncing}
                        className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        <Upload className="w-3 h-3" />
                        {lang === "es" ? "Forzar Respaldo" : "Force Backup"}
                      </button>

                      <button
                        onClick={handleDownloadFromDrive}
                        disabled={isSyncing}
                        className="py-2.5 px-2 bg-white border border-slate-200 hover:bg-slate-100/50 text-slate-600 font-semibold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3 text-emerald-500" />
                        {lang === "es" ? "Restaurar" : "Restore"}
                      </button>
                    </div>

                    {isSyncing && (
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[11px] animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Sincronizando...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-400 font-sans relative">
        <div id="privacy-policy" className="absolute -top-20"></div>
        <p>
          © 2026 {lang === "es" ? "Desarrollado por " : "Developed by "}
          <a href="https://ana-catalina.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 transition-colors font-semibold">
            Ana-Catalina
          </a>
        </p>
        <div className="mt-2 mb-4 max-w-2xl mx-auto px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
          <p>
            {lang === "es" 
              ? "El propósito de esta aplicación es ayudarte a registrar tus hábitos diarios, estado de ánimo, rutinas y calidad de sueño. Todos los datos se almacenan y analizan localmente en tu dispositivo para ofrecerte estadísticas personalizadas sobre tu bienestar." 
              : "The purpose of this application is to help you track your daily habits, mood, routines, and sleep quality. All data is stored and analyzed locally on your device to provide personalized statistics about your well-being."}
          </p>
        </div>
        <a 
          href={lang === "es" ? "/privacy.html#es" : "/privacy.html#en"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 hover:decoration-indigo-300 cursor-pointer inline-block"
        >
          {lang === "es" ? "Política de Privacidad y Términos de Servicio" : "Privacy Policy & Terms of Service"}
        </a>
      </footer>


    </div>
  );
}
