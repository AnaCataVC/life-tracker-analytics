# Life Tracker Analytics: Math and Statistics Documentation

This document outlines the mathematical formulas, statistical methods, and heuristic logic used within the Life Tracker Analytics application to derive user insights, generate correlations, and calculate well-being scores. All calculations are performed entirely client-side (offline).

---

## 0. Core Philosophy: Individual Impact over Aggregate Compliance

A fundamental design decision in Life Tracker Analytics is that **we do not evaluate well-being based on aggregate compliance ratios** (e.g., "percentage of daily tasks completed" or "percentage of daily medications taken").

Evaluating raw percentages can be misleading and psychologically counterproductive. Completing 10 trivial tasks shouldn't artificially inflate your wellness score, nor should taking a large quantity of different medications imply a better focus metric.

Instead, the analytics engine strictly evaluates **individual impact**. The system isolates each specific habit, task, and medication, comparing the user's metrics (Mood, Focus) on days it was completed versus days it was not. This ensures that the application identifies the *true* underlying value of each specific action rather than rewarding the simple act of checking off boxes.

> **Important:** All results are **associations**, not causes. Correlation does not imply causation. The engine explicitly uses associative language in all UI text.

---

## 1. Core Statistical Foundation (`statistics.ts`)

All statistical primitives are centralized in `src/utils/heuristics/statistics.ts` as pure, side-effect-free functions.

### 1.1 Arithmetic Mean
For any metric $X$ recorded over $N$ days:
$$\bar{X} = \frac{1}{N} \sum_{i=1}^{N} X_i$$

Returns 0 for empty arrays (division-by-zero guard).

### 1.2 Population Standard Deviation
$$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (X_i - \bar{X})^2}$$

Returns 0 for arrays with fewer than 2 elements.

### 1.3 Minimum Sample Size Guard
A constant `MIN_SAMPLE_SIZE = 5` enforces that **both comparison groups must have at least 5 data points** before any insight is computed. Groups with fewer entries receive `confidence: "insufficient"` and all deltas are zeroed out.

This prevents misleading insights derived from N=1 or N=2 observations — a critical safeguard for a personal health-tracking context.

### 1.4 Confidence Tier (`ConfidenceLevel`)

Every computed insight receives a confidence tier based on sample sizes and effect magnitude:

| Tier | Condition |
|---|---|
| `"insufficient"` | Either group has < 5 entries |
| `"low"` | Effect size (Cohen's d) < 0.2 — negligible difference |
| `"moderate"` | Effect size 0.2–0.5, OR both groups have 5–9 entries |
| `"high"` | Effect size ≥ 0.5 AND both groups have ≥ 10 entries |

Insights with `"insufficient"` or `"low"` confidence are **never shown** in the UI to avoid noise.

---

## 2. Pearson Correlation (Continuous Variables)

Rather than splitting data into arbitrary binary buckets (e.g., "≥7.5h" vs "<7.5h"), the engine uses the **Pearson correlation coefficient** to measure the linear relationship between two continuous variables across the full history.

$$r = \frac{\text{Cov}(X, Y)}{\sigma_X \cdot \sigma_Y} = \frac{\frac{1}{N}\sum_{i=1}^{N}(X_i - \bar{X})(Y_i - \bar{Y})}{\sigma_X \cdot \sigma_Y}$$

Where $r \in [-1, 1]$:
- $r \approx +1$: strong positive linear association
- $r \approx -1$: strong negative linear association
- $r \approx 0$: no linear relationship

Returns 0 if either variable has zero variance, or if $N < 5$.

### 2.1 Sleep Duration ↔ Mood Rating

- **Variables:** `getTotalSleep(entry)` (hours) and `entry.mood` (0–10)
- **Result:** Pearson $r$ displayed as `r = +0.72` in the correlation description
- **Direction thresholds:** `|r| ≥ 0.2` declares a non-neutral trend

### 2.2 Sleep Quality ↔ Concentration (Focus)

- **Variables:** `entry.sleepQuality` (0–10) and `entry.concentration` (0–10)
- **Result:** Pearson $r$ displayed inline
- **Note:** Negative $r$ includes a reverse-causality disclaimer in the UI

> **Why Pearson instead of bins?** Binary thresholds (e.g., ≥7.5h) are arbitrary and discard the continuous nature of the data. Pearson uses every data point and its actual value, making it more robust and honest about the strength of the relationship.

---

## 3. The Well-Being Index Score Formula

The global Well-Being Score is a dynamic, weighted index normalized to a 1–100 scale. It aggregates key pillars of the user's logged data to provide a single, holistic metric.

1. **Mood Score ($W_1 = 50\%$):**
   $$S_{\text{mood}} = \left( \frac{\bar{\text{Mood}}}{10} \right) \times 100$$

2. **Sleep Score ($W_2 = 50\%$):** Average of Duration Score and Quality Score.
   $$S_{\text{sleep\_dur}} = \min\left( \frac{\bar{\text{SleepDur}}}{8} \times 100,\ 100 \right)$$
   $$S_{\text{sleep\_qual}} = \left( \frac{\bar{\text{SleepQual}}}{10} \right) \times 100$$
   $$S_{\text{sleep}} = \frac{S_{\text{sleep\_dur}} + S_{\text{sleep\_qual}}}{2}$$

**Final Calculation:**
$$\text{Score} = \text{clamp}\left( \text{round}\left( (S_{\text{mood}} \times 0.50) + (S_{\text{sleep}} \times 0.50) \right),\ 1,\ 100 \right)$$

---

## 4. Individual Impact Analysis (A/B Factor Testing)

To measure the association of each specific habit or medication with the user's mood, focus, and sleep, the engine performs a direct group comparison for every unique item ever logged.

### 4.1 Group Splitting

For a given factor $F$:
- $G_{\text{with}}$: Days where $F$ was **completed or taken**.
- $G_{\text{without}}$: Days where $F$ was present in the log but **NOT completed or taken**.

### 4.2 Minimum Sample Guard

Before computing any comparison:
$$|G_{\text{with}}| \geq 5 \quad \text{AND} \quad |G_{\text{without}}| \geq 5$$

If this condition fails, `confidence = "insufficient"` and all deltas are set to 0.

### 4.3 Group Means

$$\bar{\text{Mood}}_{\text{with}},\ \bar{\text{Mood}}_{\text{without}},\ \bar{\text{Focus}}_{\text{with}},\ \bar{\text{Focus}}_{\text{without}}, \ldots$$

### 4.4 Direct Group Deltas

$$\Delta_{\text{mood}} = \bar{\text{Mood}}_{\text{with}} - \bar{\text{Mood}}_{\text{without}}$$
$$\Delta_{\text{focus}} = \bar{\text{Focus}}_{\text{with}} - \bar{\text{Focus}}_{\text{without}}$$
$$\Delta_{\text{sleep\_dur}} = \bar{\text{SleepDur}}_{\text{with}} - \bar{\text{SleepDur}}_{\text{without}}$$
$$\Delta_{\text{sleep\_qual}} = \bar{\text{SleepQual}}_{\text{with}} - \bar{\text{SleepQual}}_{\text{without}}$$

> **Why not compare against the global average?** Using the global average as the baseline introduces **baseline contamination** — since the "with" group is part of the overall mean, the difference is systematically underestimated. A direct group-vs-group comparison is an isolated, unbiased measure.

### 4.5 Cohen's d Effect Size

To measure the practical magnitude of the difference (beyond just the raw delta), the engine computes a simplified Cohen's d using pooled population standard deviation:

$$d = \frac{|\bar{\text{Mood}}_{\text{with}} - \bar{\text{Mood}}_{\text{without}}|}{\sqrt{\frac{\sigma_{\text{with}}^2 + \sigma_{\text{without}}^2}{2}}}$$

Cohen's d thresholds used:
| Range | Interpretation |
|---|---|
| $d < 0.2$ | Negligible (`"low"` confidence) |
| $0.2 \leq d < 0.5$ | Small–medium effect (`"moderate"`) |
| $d \geq 0.5$ | Medium–large effect (contributes to `"high"` if N ≥ 10) |

### 4.6 Associated Mood Tags

For both groups, the engine calculates the **relative frequency** of each qualitative mood tag:
$$\text{freq}(T, G) = \frac{\text{count}(T \in G)}{|G|}$$

A tag $T$ is considered associated with factor $F$ if:
$$\text{freq}(T, G_{\text{with}}) \geq 0.20 \quad \text{AND} \quad \text{freq}(T, G_{\text{with}}) \geq \text{freq}(T, G_{\text{without}}) + 0.15$$

Results are sorted by largest frequency difference descending.

---

## 5. Actionable Insights Generation

Actionable text recommendations are derived from the individual impacts and aggregate sleep averages.

**Filtering rules:**
- Only impacts with `confidence === "high"` or `"moderate"` generate actionable text.
- `"insufficient"` and `"low"` entries are silently skipped.
- Items with `"moderate"` confidence append a *(limited data)* disclaimer to their text.

**Association thresholds for surfacing an insight:**
- Positive or negative association: $|\Delta_{\text{mood}}| \geq 0.5$ or $|\Delta_{\text{focus}}| \geq 0.5$
- An actionable suggestion (maintain in routine) is generated when $|\Delta_{\text{mood}}| \geq 0.8$

All text uses associative language: *"is associated with"*, *"tends to coincide with"* — never causal framing like *"causes"*, *"harms"*, or *"penalizes"*.

---

## 6. Temporal Analysis (Weekday vs. Weekend)

The analytics charts group daily logs by their day of the week to analyze temporal lifestyle patterns:
- **Weekday Average:** Arithmetic mean of mood/focus for logs where `DayOfWeek ∈ [1, 5]` (Monday–Friday).
- **Weekend Average:** Arithmetic mean of mood/focus for logs where `DayOfWeek ∈ [0, 6]` (Sunday and Saturday).

The absolute difference $|\bar{\text{Mood}}_{\text{weekend}} - \bar{\text{Mood}}_{\text{weekday}}|$ is calculated. A narrative is generated based on which average is higher.
