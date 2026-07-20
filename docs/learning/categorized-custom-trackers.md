# Pattern: Categorized Custom Trackers & Dynamic Form Injection

**Date:** July 19, 2026
**Context:** Shifting the "Custom Trackers" feature from a generic, isolated form section (a catch-all bucket) to a strictly categorized metadata structure embedded contextually inside the main form sections.

## 🧩 Architectural Decisions

### 1. Strict Domain Typing (`TrackerCategory`)
Instead of allowing open-ended string categories (which usually leads to fragmented UI grouping and data inconsistencies), we introduced a strict type union:
```typescript
export type TrackerCategory = "mood" | "sleep" | "focus";
```
This constraint forces both the UI configuration and the heuristics engine to maintain metrics within a manageable dimensionality, preventing the UI from breaking or becoming overly cluttered.

### 2. Elimination of the "Catch-all" Form Section
We decided to completely remove "Section 6: Custom Trackers" from the Daily Logging Form. By forcing each custom tracker to have a defined origin or area of impact (e.g., *Nightmares* belongs in *Sleep*, *Panic Attacks* belongs in *Mood*), the form becomes less intimidating, more contextual, and groups variables logically before they are saved to the local database.

## 🛠️ Implemented Patterns

### 1. Template-to-Render Pattern (Dynamic Injection)
The application state and structure for these trackers are saved in a master JSON array within `localStorage` (via the `wellbeing_customtrackers_template` key), including their respective categories.

The core form (`TrackingForm.tsx`) doesn't hardcode these variables. Instead, it delegates the rendering to a bridge function:
```tsx
const renderCustomTrackersForCategory = (category: TrackerCategory) => {
  // Filters the injected trackers for the specific block and renders them dynamically
}
```
This intercepts the state array at runtime, filters it by the block being rendered (Mood, Sleep, or Focus), and draws it in real-time at the bottom of the corresponding UI Card.

### 2. Universal Heuristics Engine
We extended the statistical engine (`individualImpacts.ts`) to process arbitrary boolean variables automatically. A custom tracker (`true`/`false`) is now treated interchangeably with a medication dose or the completion of a daily habit. This prevents code duplication in the analytics correlations logic.

## 💡 Key Takeaway
Forcing rigid categorizations early on user-defined dynamic fields significantly cleans up the UI/UX. When users categorize their custom data points, the application can render them contextually where they make sense rather than relying on a generic "Miscellaneous" section.
