import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../utils/db";
import { LogEntry } from "../types";
import { getTodayDateString } from "../utils/helpers";

export function useTrackingLogs() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Reactive subscription to Dexie logs
  const logsFromDB = useLiveQuery(() => db.logs.toArray(), []);

  // Sorted logs (newest first)
  const historyLogs = useMemo(() => {
    if (!logsFromDB) return [];
    return [...logsFromDB].sort((a, b) => b.date.localeCompare(a.date));
  }, [logsFromDB]);

  // Current entry for the selected date
  const currentEntry = useMemo(() => {
    return historyLogs.find((log) => log.date === selectedDate);
  }, [historyLogs, selectedDate]);

  const saveLog = async (entry: LogEntry) => {
    await db.logs.put(entry);
  };

  const deleteLog = async (date: string) => {
    await db.logs.delete(date);
  };

  const clearAllLogs = async () => {
    await db.logs.clear();
  };

  return {
    selectedDate,
    setSelectedDate,
    historyLogs,
    currentEntry,
    saveLog,
    deleteLog,
    clearAllLogs,
    isLoadingLogs: logsFromDB === undefined,
  };
}
