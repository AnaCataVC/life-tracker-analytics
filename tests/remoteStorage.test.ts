import { describe, it, expect } from "vitest";
import { mergeLogs } from "../src/utils/remoteStorage";
import { LogEntry } from "../src/types";

describe("RemoteStorage Granular Merge Logic", () => {
  const createMockEntry = (date: string, mood: number, taskNames: string[] = []): LogEntry => ({
    date,
    mood,
    sleepQuality: 8,
    sleepDuration: 8,
    concentration: 8,
    bedtime: "23:00",
    waketime: "07:00",
    tasks: taskNames.map((name) => ({ name, completed: true })),
    medications: [],
    moodTags: ["peaceful"],
    notes: `Note for ${date}`,
  });

  it("should return empty array if both local and remote are empty", () => {
    expect(mergeLogs([], [])).toEqual([]);
  });

  it("should preserve all disjoint dates from both local and remote devices", () => {
    const local = [createMockEntry("2026-08-01", 8), createMockEntry("2026-08-02", 9)];
    const remote = [createMockEntry("2026-08-03", 7), createMockEntry("2026-08-04", 6)];

    const merged = mergeLogs(local, remote);
    expect(merged.length).toBe(4);
    // Ordered descending
    expect(merged.map((e) => e.date)).toEqual([
      "2026-08-04",
      "2026-08-03",
      "2026-08-02",
      "2026-08-01",
    ]);
  });

  it("should reconcile overlapping dates by merging tasks and preserving fields without losing data", () => {
    const localEntry = createMockEntry("2026-08-01", 9, ["Walk in Park"]);
    const remoteEntry = createMockEntry("2026-08-01", 8, ["Read Book"]);

    const merged = mergeLogs([localEntry], [remoteEntry]);
    expect(merged.length).toBe(1);
    expect(merged[0].date).toBe("2026-08-01");
    // Tasks should be combined
    expect(merged[0].tasks.map((t) => t.name)).toContain("Walk in Park");
    expect(merged[0].tasks.map((t) => t.name)).toContain("Read Book");
  });

  it("should handle single side presence gracefully", () => {
    const local = [createMockEntry("2026-08-01", 8)];
    expect(mergeLogs(local, []).length).toBe(1);
    expect(mergeLogs([], local).length).toBe(1);
  });
});
