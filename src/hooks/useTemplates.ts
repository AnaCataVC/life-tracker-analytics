import { useState, useEffect } from "react";
import { TrackerCategory } from "../types";
import { db, HabitTemplate, MedicationTemplate, CustomTrackerTemplate } from "../utils/db";

export function useTemplates() {
  const [medicationTemplate, setMedicationTemplate] = useState<{ name: string; dosage: string }[]>([]);
  const [habitsTemplate, setHabitsTemplate] = useState<{ name: string }[]>([]);
  const [customTrackersTemplate, setCustomTrackersTemplate] = useState<{ name: string; category: TrackerCategory }[]>([]);

  // Load from Dexie and migrate from localStorage if needed
  useEffect(() => {
    async function loadTemplates() {
      try {
        const dexieMeds = await db.medicationTemplates.toArray();
        const dexieHabits = await db.habitTemplates.toArray();
        const dexieCustoms = await db.customTrackerTemplates.toArray();

        // Check if Dexie has items
        if (dexieMeds.length > 0) {
          setMedicationTemplate(dexieMeds.map((m) => ({ name: m.name, dosage: m.dosage })));
        } else {
          // Migration from localStorage
          const savedMeds = localStorage.getItem("wellbeing_meds_template");
          if (savedMeds) {
            try {
              const parsed = JSON.parse(savedMeds);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name !== "Multivitamin") {
                setMedicationTemplate(parsed);
                await db.medicationTemplates.bulkPut(parsed);
              }
            } catch (e) {
              console.error("Error migrating meds template:", e);
            }
          }
        }

        if (dexieHabits.length > 0) {
          setHabitsTemplate(dexieHabits.map((h) => ({ name: h.name })));
        } else {
          const savedHabits = localStorage.getItem("wellbeing_habits_template");
          if (savedHabits) {
            try {
              const parsed = JSON.parse(savedHabits);
              if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].name.includes("Beber 2 litros")) {
                setHabitsTemplate(parsed);
                await db.habitTemplates.bulkPut(parsed);
              }
            } catch (e) {
              console.error("Error migrating habits template:", e);
            }
          }
        }

        if (dexieCustoms.length > 0) {
          setCustomTrackersTemplate(dexieCustoms.map((c) => ({ name: c.name, category: c.category })));
        } else {
          const savedCustoms = localStorage.getItem("wellbeing_customtrackers_template");
          if (savedCustoms) {
            try {
              const parsed = JSON.parse(savedCustoms);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCustomTrackersTemplate(parsed);
                await db.customTrackerTemplates.bulkPut(parsed);
              }
            } catch (e) {
              console.error("Error migrating custom trackers template:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error loading templates from Dexie:", err);
      }
    }

    loadTemplates();
  }, []);

  const updateMedicationTemplate = async (meds: { name: string; dosage: string }[]) => {
    setMedicationTemplate(meds);
    try {
      localStorage.setItem("wellbeing_meds_template", JSON.stringify(meds));
      await db.medicationTemplates.clear();
      if (meds.length > 0) {
        await db.medicationTemplates.bulkPut(meds);
      }
    } catch (e) {
      console.error("Error persisting medication template:", e);
    }
  };

  const updateHabitsTemplate = async (habits: { name: string }[]) => {
    setHabitsTemplate(habits);
    try {
      localStorage.setItem("wellbeing_habits_template", JSON.stringify(habits));
      await db.habitTemplates.clear();
      if (habits.length > 0) {
        await db.habitTemplates.bulkPut(habits);
      }
    } catch (e) {
      console.error("Error persisting habits template:", e);
    }
  };

  const updateCustomTrackersTemplate = async (trackers: { name: string; category: TrackerCategory }[]) => {
    setCustomTrackersTemplate(trackers);
    try {
      localStorage.setItem("wellbeing_customtrackers_template", JSON.stringify(trackers));
      await db.customTrackerTemplates.clear();
      if (trackers.length > 0) {
        await db.customTrackerTemplates.bulkPut(trackers);
      }
    } catch (e) {
      console.error("Error persisting custom trackers template:", e);
    }
  };

  const clearAllTemplates = async () => {
    setMedicationTemplate([]);
    setHabitsTemplate([]);
    setCustomTrackersTemplate([]);
    localStorage.removeItem("wellbeing_meds_template");
    localStorage.removeItem("wellbeing_habits_template");
    localStorage.removeItem("wellbeing_customtrackers_template");
    await db.medicationTemplates.clear();
    await db.habitTemplates.clear();
    await db.customTrackerTemplates.clear();
  };

  return {
    medicationTemplate,
    habitsTemplate,
    customTrackersTemplate,
    setMedicationTemplate: updateMedicationTemplate,
    setHabitsTemplate: updateHabitsTemplate,
    setCustomTrackersTemplate: updateCustomTrackersTemplate,
    clearAllTemplates,
  };
}
