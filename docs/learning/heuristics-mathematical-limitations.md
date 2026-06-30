# Limitations and Refactoring Plan for Well-being Heuristics

This document details the findings from the Expert Council evaluation of the mathematical, statistical, and health-related heuristics used to calculate correlations and actionable insights in the Life Tracker & Analytics project.

## Context
The codebase calculates well-being insights and correlation metrics in client-side TypeScript (inside `src/utils/heuristics/`). A review was conducted to identify misleading analytics, logical flaws, or safety issues from both statistical and human health perspectives.

## Identified Limitations

### 1. Statistical Insignificance (The $N=1$ Problem)
- **Flaw:** The system calculates and compares averages (e.g., `avgMoodWith` vs. `avgMoodWithout` in `individualImpacts.ts`) as long as there is at least one day logged in each group (`daysWith.length > 0`).
- **Impact:** Single outliers drastically skew the results. If a user logs "Exercise" once, and that day happens to have a very high mood for independent reasons, the application falsely correlates exercise with a massive mood boost.
- **Fixed Deltas:** Using arbitrary hardcoded thresholds (like `> 0.3` difference) to declare correlation ignores the individual's baseline variance (e.g., standard deviation).

### 2. Reverse Causality & Causal UI Language
- **Flaw:** The heuristics compare days "with" an action versus days "without" and directly attribute causality. 
- **Impact:** In psychology, a user often fails to perform a habit (e.g., exercise or socializing) *because* their mood or energy was already low, rather than the missed habit causing the low mood.
- **Medical Confounders:** For medications (e.g., taking Ibuprofen), a user logs it on days they feel sick. The app observes `avgMoodWith < avgMoodWithout` and erroneously concludes that Ibuprofen ruins the user's mood.
- **Anxiety/Guilt:** Categorical UI warnings like *"Not doing X harms you"* can cause performance anxiety and guilt, worsening mental well-being (e.g., orthosomnia).

### 3. Strict Dichotomization
- **Flaw:** Continuous variables like sleep duration are bucketed into arbitrary binary states (e.g., sleep `>= 7.5` vs `< 7.5` hours).
- **Impact:** A night with 7.4 hours of sleep is treated identically to 3 hours of sleep, destroying continuous variance and ignoring individual biological requirements (chronotypes).

### 4. Flawed Baselines
- **Flaw:** `actionable.ts` calculates `moodDrop = avgMood - impact.avgMoodWithout`, where `avgMood` is the overall global average.
- **Impact:** The global average baseline already includes the days without the habit. If a habit is rarely done, `avgMood` and `avgMoodWithout` are virtually identical, preventing the insight from triggering.

### 5. Lack of Temporal Lag
- **Flaw:** All parameters are compared on the same calendar day.
- **Impact:** Many health-related metrics have delayed effects (e.g., today's workout improves tonight's sleep, or yesterday's sleep affects today's concentration).

---

## Action Plan / Refactoring Guidelines

When refactoring the heuristic engine, the following design decisions must be implemented:

1. **Minimum Sample Size Filter:** Require a minimum of $N \ge 5$ occurrences in both the "With" and "Without" groups before generating an insight or correlation score.
2. **Causal Language Mitigation:** Rewrite UI output strings to use descriptive correlation terms rather than causal ones (e.g., *"Associated with"* instead of *"Harms you"*).
3. **Statistical Significance/Standard Deviation:** Use a standard-deviation-based filter or standard mathematical correlation coefficients (like Pearson) for continuous variables.
4. **Isolated Comparisons:** Ensure lines of comparison compare the "With" group directly against the "Without" group rather than against a contaminated global average.
