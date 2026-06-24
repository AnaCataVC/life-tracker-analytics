# Life Tracker Analytics: Math and Statistics Documentation

This document outlines the mathematical formulas, statistical methods, and heuristic logic used within the Life Tracker Analytics application to derive user insights, generate correlations, and calculate well-being scores. All calculations are performed entirely client-side (offline).

## 0. Core Philosophy: Individual Impact over Aggregate Compliance

A fundamental design decision in Life Tracker Analytics is that **we do not evaluate well-being based on aggregate compliance ratios** (e.g., "percentage of daily tasks completed" or "percentage of daily medications taken"). 

Evaluating raw percentages can be misleading and psychologically counterproductive. Completing 10 trivial tasks shouldn't artificially inflate your wellness score, nor should taking a large quantity of different medications imply a better focus metric. 

Instead, the analytics engine strictly evaluates **individual impact**. The system isolates each specific habit, task, and medication, comparing the user's metrics (Mood, Focus) on days it was completed versus days it was not. This ensures that the application identifies the *true* underlying value of each specific action rather than rewarding the simple act of checking off boxes.

## 1. Descriptive Statistics & Baselines

### 1.1 Simple Averages (Means)
For any metric $X$ (e.g., Mood, Sleep Duration, Focus, Sleep Quality) recorded over $N$ days, the baseline average is calculated as the standard arithmetic mean:
$$ \bar{X} = \frac{1}{N} \sum_{i=1}^{N} X_i $$



---

## 2. Statistical Grouping & Heuristic Correlations

Rather than using complex regression models, the application uses group-based A/B testing logic to discover and present actionable correlations to the user. It splits the historical dataset into two distinct groups based on predefined threshold conditions and compares the means of a target variable.

### 2.1 Sleep Duration vs. Mood Rating
- **Condition:** High Sleep Days ($X \ge 7.5$ hours) vs. Low Sleep Days ($X < 7.5$ hours).
- **Target:** Average Mood.
- **Math:** $\Delta = \bar{\text{Mood}}_{\text{HighSleep}} - \bar{\text{Mood}}_{\text{LowSleep}}$
- **Threshold:** If $\Delta > 0.3$, the correlation is labeled as positive. If $\Delta < -0.3$, it is negative. Otherwise, it is considered neutral.

### 2.2 Sleep Quality vs. Concentration (Focus)
- **Condition:** High Quality Days ($X \ge 7/10$) vs. Low Quality Days ($X < 7/10$).
- **Target:** Average Concentration.
- **Math:** $\Delta = \bar{\text{Focus}}_{\text{HighQual}} - \bar{\text{Focus}}_{\text{LowQual}}$
- **Threshold:** A difference of $\pm 0.3$ points determines the correlation direction.



## 3. The Well-Being Index Score Formula

The global Well-Being Score is a dynamic, weighted index normalized to a 1-100 scale. It aggregates key pillars of the user's logged data to provide a single, holistic health metric.

1. **Mood Score ($W_1 = 50\%$):** 
   $$ S_{\text{mood}} = \left( \frac{\bar{\text{Mood}}}{10} \right) \times 100 $$

2. **Sleep Score ($W_2 = 50\%$):** Calculated as the average of a Duration Score and a Quality Score.
   $$ S_{\text{sleep\_dur}} = \min\left( \frac{\bar{\text{SleepDur}}}{8} \times 100, 100 \right) $$
   $$ S_{\text{sleep\_qual}} = \left( \frac{\bar{\text{SleepQual}}}{10} \right) \times 100 $$
   $$ S_{\text{sleep}} = \frac{S_{\text{sleep\_dur}} + S_{\text{sleep\_qual}}}{2} $$

**Final Calculation:**
$$ \text{Raw Score} = (S_{\text{mood}} \times 0.50) + (S_{\text{sleep}} \times 0.50) $$

The final result is rounded to the nearest whole number and clamped between a minimum of 1 and a maximum of 100.

---

## 4. Individual Impact Analysis (A/B Factor Testing)

To measure the precise impact of specific habits (e.g., "Morning Jog") and specific medications on the user's mood and focus, the analytics engine iterates over every unique item ever logged and performs a comparative delta analysis.

For a given factor $F$:
1. **Filter Groups:** 
   - $G_{\text{with}}$: The set of days where $F$ was explicitly completed or taken.
   - $G_{\text{without}}$: The set of days where $F$ was present in the log but NOT completed or taken.
2. **Calculate Means:** 
   - $\bar{\text{Mood}}_{\text{with}}$ and $\bar{\text{Mood}}_{\text{without}}$
   - $\bar{\text{Focus}}_{\text{with}}$ and $\bar{\text{Focus}}_{\text{without}}$
   - $\bar{\text{SleepDur}}_{\text{with}}$ and $\bar{\text{SleepDur}}_{\text{without}}$
   - $\bar{\text{SleepQual}}_{\text{with}}$ and $\bar{\text{SleepQual}}_{\text{without}}$
3. **Calculate Deltas:**
   $$ \Delta_{\text{mood}} = \bar{\text{Mood}}_{\text{with}} - \bar{\text{Mood}}_{\text{without}} $$
   $$ \Delta_{\text{focus}} = \bar{\text{Focus}}_{\text{with}} - \bar{\text{Focus}}_{\text{without}} $$
   $$ \Delta_{\text{sleep\_dur}} = \bar{\text{SleepDur}}_{\text{with}} - \bar{\text{SleepDur}}_{\text{without}} $$
   $$ \Delta_{\text{sleep\_qual}} = \bar{\text{SleepQual}}_{\text{with}} - \bar{\text{SleepQual}}_{\text{without}} $$
4. **Calculate Associated Mood Tags:**
   - For both $G_{\text{with}}$ and $G_{\text{without}}$, calculate the relative frequency of each recorded qualitative mood tag.
   - A tag $T$ is deemed "associated" with factor $F$ if its relative frequency in $G_{\text{with}}$ is $\ge 20\%$ AND its frequency in $G_{\text{with}}$ is at least $15$ percentage points higher than in $G_{\text{without}}$.

These raw deltas ($\Delta_{\text{mood}}$, $\Delta_{\text{focus}}$, $\Delta_{\text{sleep\_dur}}$, and $\Delta_{\text{sleep\_qual}}$) and associated tags are then presented visually to the user, identifying exactly how many points, hours of sleep, and which feelings a single habit or medicine adds or subtracts from their baseline well-being.

### 4.1 Omission Insights (Actionable Warnings)

In addition to A/B factor deltas, the engine generates actionable warnings by calculating the **Omission Penalty**. This compares the user's overall baseline average to the average on days when a specific habit or medication was *omitted*.

For a given factor $F$:
$$ \text{Mood Drop} = \bar{\text{Mood}}_{\text{overall}} - \bar{\text{Mood}}_{\text{without}} $$
$$ \text{Focus Drop} = \bar{\text{Focus}}_{\text{overall}} - \bar{\text{Focus}}_{\text{without}} $$

If the resulting drop is significant (e.g., $\ge 0.5$ points), the system triggers an actionable insight, actively warning the user about the statistical harm of skipping that specific factor compared to their normal baseline.

---

## 5. Temporal Analysis (Weekday vs. Weekend)

The analytics charts group daily logs by their day of the week to analyze temporal lifestyle patterns:
- **Weekday Average:** Arithmetic mean of mood/focus for logs where `DayOfWeek \in [1, 5]` (Monday-Friday).
- **Weekend Average:** Arithmetic mean of mood/focus for logs where `DayOfWeek \in [0, 6]` (Sunday and Saturday).

The absolute difference $|\bar{\text{Mood}}_{\text{weekend}} - \bar{\text{Mood}}_{\text{weekday}}|$ is calculated. A narrative is then generated based on which average is higher, giving the user insights regarding routine balance and work-week structural fatigue.
