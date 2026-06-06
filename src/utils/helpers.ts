import { LogEntry, TaskItem, MedicationItem } from "../types";

/**
 * Calculates the sleep duration in hours given a bedtime and a waketime (HH:MM format)
 */
export function calculateSleepDuration(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0;

  const [bedHours, bedMins] = bedtime.split(":").map(Number);
  const [wakeHours, wakeMins] = waketime.split(":").map(Number);

  let duration = (wakeHours * 60 + wakeMins) - (bedHours * 60 + bedMins);

  // If bedtime is later than waketime (e.g., sleep at 23:00, wake at 07:00 next day)
  if (duration < 0) {
    duration += 24 * 60; // add a full day in minutes
  }

  return parseFloat((duration / 60).toFixed(1));
}

/**
 * Returns formatted date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Pre-populates 7 days of realistic and balanced tracking history to showcase 
 * the correlations, graphs, and the AI Insight generator out-of-the-box.
 */
export function getSampleHistory(): LogEntry[] {
  return [
    {
      date: "2026-05-20",
      mood: 8,
      moodNotes: "Felt very refreshed. Work was highly productive and had good energy.",
      moodTags: ["peaceful", "energetic", "calm"],
      sleepQuality: 9,
      bedtime: "22:45",
      waketime: "07:00",
      sleepDuration: 8.3,
      concentration: 9,
      tasks: [
        { id: "t1", name: "Submit project report", completed: true },
        { id: "t2", name: "Gym workout session", completed: true },
        { id: "t3", name: "Stretch & Meditate", completed: true }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: true },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: true }
      ]
    },
    {
      date: "2026-05-21",
      mood: 6,
      moodNotes: "Slept a bit late, struggled to focus in the afternoon. Missed medicine.",
      moodTags: ["tired", "anxious"],
      sleepQuality: 5,
      bedtime: "01:15",
      waketime: "07:00",
      sleepDuration: 5.8,
      concentration: 5,
      tasks: [
        { id: "t1", name: "Client review meeting", completed: true },
        { id: "t2", name: "Clean the kitchen", completed: false },
        { id: "t3", name: "Stretch & Meditate", completed: false }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: false },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: false }
      ]
    },
    {
      date: "2026-05-22",
      mood: 7,
      moodNotes: "Better focus today. Had an early night afterwards.",
      moodTags: ["calm", "productive"],
      sleepQuality: 7,
      bedtime: "23:00",
      waketime: "07:15",
      sleepDuration: 8.3,
      concentration: 7,
      tasks: [
        { id: "t1", name: "Clean the kitchen", completed: true },
        { id: "t2", name: "Respond to urgent emails", completed: true },
        { id: "t3", name: "Read 10 pages in book", completed: true }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: true },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: true }
      ]
    },
    {
      date: "2026-05-23",
      mood: 9,
      moodNotes: "Excellent concentration levels and great mood today! Took multi early.",
      moodTags: ["hyperfocused", "energetic"],
      sleepQuality: 8,
      bedtime: "22:30",
      waketime: "06:45",
      sleepDuration: 8.3,
      concentration: 9,
      tasks: [
        { id: "t1", name: "Complete coding assignments", completed: true },
        { id: "t2", name: "Grocery shopping", completed: true },
        { id: "t3", name: "Prep healthy food", completed: true }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: true },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: true }
      ]
    },
    {
      date: "2026-05-24",
      mood: 5,
      moodNotes: "Felt very distracted and low energy. Stayed up playing video games.",
      moodTags: ["tired", "stressed"],
      sleepQuality: 4,
      bedtime: "02:00",
      waketime: "07:30",
      sleepDuration: 5.5,
      concentration: 4,
      tasks: [
        { id: "t1", name: "Pay credit card bill", completed: false },
        { id: "t2", name: "Plan upcoming week", completed: false },
        { id: "t3", name: "Stretching program", completed: false }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: true },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: false }
      ]
    },
    {
      date: "2026-05-25",
      mood: 7,
      moodNotes: "Woke mid-sleep but energy recovered by evening. Re-initiated routine.",
      moodTags: ["peaceful", "calm"],
      sleepQuality: 7,
      bedtime: "23:15",
      waketime: "07:30",
      sleepDuration: 8.3,
      concentration: 7,
      tasks: [
        { id: "t1", name: "Pay credit card bill", completed: true },
        { id: "t2", name: "Laundry & tidy-up", completed: true },
        { id: "t3", name: "Stretching program", completed: true }
      ],
      medications: [
        { id: "m1", name: "Multivitamin", dosage: "1 Pill", taken: true },
        { id: "m2", name: "Melatonin", dosage: "5mg", taken: true }
      ]
    }
  ];
}
