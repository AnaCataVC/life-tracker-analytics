# Analytics Methodology & Statistical Guardrails

This document establishes the formal statistical methodology, data processing contracts, and mathematical guardrails governing the analytical engine of **Life Tracker & Analytics**.

---

## 1. Executive Summary & Foundational Principles

Personal well-being tracking operates on longitudinal $N=1$ time series. Unlike population-level clinical studies or cross-sectional surveys, personal self-tracked metrics are inherently sparse, autocorrelated, and prone to subjective recording bias.

To deliver scientifically defensible insights without exposing private health data, the analytical engine is engineered around four core tenets:

1. **Client-Side Analytical Execution (Local-First):**
   All computations, statistical tests, rolling windows, and heuristic derivations run client-side in pure TypeScript. No personal well-being logs, medication records, or timestamps are ever transmitted to an external inference API or server.
2. **Individual Impact over Aggregate Compliance:**
   We strictly reject aggregate compliance scores (e.g., *"you completed 80% of daily goals"*) as a metric of well-being. A 100% compliance day with 4 hours of sleep and high anxiety is not a success state. The engine evaluates *individual factor impact* (how a specific habit, medication, or sleep duration shifts an outcome metric relative to its absence).
3. **Transparent Descriptive Statistics over Superfluous Machine Learning:**
   Complex predictive models (e.g., neural networks or decision trees) trained on sparse $N=1$ longitudinal datasets with fewer than 365 observations suffer from extreme overfitting, opacity, and false precision. Transparent descriptive statistics (Pearson $r$, Cohen's $d$, rolling baselines, and $z$-scores) provide interpretable, verifiable, and reproducible insights.
4. **Strict Associative Framing (Zero Unsubstantiated Causal Claims):**
   Observational self-tracking data cannot establish causality due to unmeasured confounding and reverse causality. All generated insights use associative phrasing (*"is associated with"*, *"tends to coincide with"*) rather than causal claims (*"improves"*, *"causes"*, *"boosts"*).

---

## 2. Metric Definitions & Data Contracts

| Metric | Domain | Units / Range | Type | Collection Semantics |
| :--- | :--- | :--- | :--- | :--- |
| **Mood** | Affective state | $1 - 10$ integer | Continuous Likert | Daily subjective evaluation ($1 = \text{Very Low}, 10 = \text{Excellent}$). |
| **Focus / Concentration** | Cognitive clarity | $1 - 10$ integer | Continuous Likert | Daily subjective assessment of sustained mental focus and clarity. |
| **Sleep Duration** | Rest volume | $[0.0, 18.0]$ hours | Continuous float | Calculated from bedtime and waketime; includes nap duration if configured. |
| **Sleep Quality** | Rest restorativeness | $1 - 10$ integer | Continuous Likert | Subjective evaluation of morning restfulness upon waking. |
| **Habits (Tasks)** | Daily routines | Boolean $\{0, 1\}$ | Binary indicator | Dichotomous tracking of habit completion on that calendar date. |
| **Medications** | Pharmacotherapy | Boolean $\{0, 1\}$ | Binary indicator | Intake event with optional dosage metadata. |
| **Mood Tags** | Qualitative nuance | Categorical string array | Multilabel discrete | Granular feeling tags (e.g., *"Calm"*, *"Anxious"*, *"Productive"*). |

---

## 3. Sparse Longitudinal Time-Series Protocol

### 3.1. Missing Data Semantics: Missing is NOT Zero
In well-being tracking, unrecorded days represent missing observations, **never zero**. Coercing a missing day to `0 hours of sleep` or `0 mood rating` severely distorts variances, deflates rolling averages, and induces phantom correlations.

- Unrecorded calendar dates are materialized as explicit `null` entries.
- All aggregations, standard deviations, and correlations filter out `null` observations.
- Sample sizes ($N$) strictly count observed, valid numeric entries.

### 3.2. UTC Calendar Date Arithmetic
To eliminate timezone offsets and Daylight Saving Time (DST) jumps (e.g., an hour lost or gained in autumn/spring resulting in 23h or 25h days):
- Every `date` string (`YYYY-MM-DD`) is parsed into its year, month, and day components and transformed into UTC timestamp milliseconds:
  $$\text{timestamp}_{\text{UTC}} = \text{Date.UTC}(Y, M - 1, D)$$
- The calendar day difference between date $A$ and date $B$ is calculated strictly as:
  $$\Delta_{\text{days}} = \left\lfloor \frac{\text{timestamp}_B - \text{timestamp}_A}{86,400,000} \right\rceil$$
- Every calendar day is guaranteed to equal exactly $86,400,000\text{ ms}$, preventing off-by-one calendar shifts regardless of user locale.

---

## 4. Windowing & Rolling Baselines

To contextualize daily metrics against the user's personal longitudinal patterns, the engine computes dual-horizon rolling windows:

```
[----------- 28-Day Personal Baseline Window -----------]
                                    [-- 7-Day Trend --]
=======================================================> Time (Days)
                                                   t (Today)
```

### 4.1. Rolling 7-Day Momentum vs. 28-Day Baseline
- **7-Day Rolling Average ($\mu_{7d}$):** Captures short-term momentum. Requires a minimum density of $\ge 4$ recorded days within the 7-day calendar window.
- **28-Day Personal Baseline ($\mu_{28d}, \sigma_{28d}$):** Captures the user's chronic homeostatic reference level. Requires a minimum density of $\ge 10$ recorded days within the 28-day calendar window.
- If data density falls below these thresholds, the metric enters an explicit `insufficient_data` state rather than estimating from sparse or distant observations.

### 4.2. Baseline Deviation & Z-Score Normalization
For a current metric value $x_t$ (or 7-day momentum $\mu_{7d}$) evaluated against a baseline distribution with mean $\mu_{28d}$ and standard deviation $\sigma_{28d}$:

$$\Delta = x_t - \mu_{28d}$$

$$z = \frac{x_t - \mu_{28d}}{\sigma_{28d}} \quad (\text{for } \sigma_{28d} > 0)$$

- **Improving Trend:** $\Delta > +0.3$ points.
- **Declining Trend:** $\Delta < -0.3$ points.
- **Stable Trend:** $-0.3 \le \Delta \le +0.3$ points.

---

## 5. Associative Statistical Engines

### 5.1. Pearson Correlation Coefficient ($r$)
For continuous metric pairs $(X, Y)$ (e.g., Sleep Duration vs. Mood):

$$r = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n} (x_i - \bar{x})^2} \sqrt{\sum_{i=1}^{n} (y_i - \bar{y})^2}}$$

- **Guardrails:**
  - Minimum sample size: $n \ge 5$ paired observations.
  - Zero-variance handling: if $\sigma_X = 0$ or $\sigma_Y = 0$, $r = 0$ (neutral).
  - Categorization: $|r| \ge 0.2$ is classified as a non-neutral association.

### 5.2. Standardized Group Effect Size (Cohen's $d$)
For dichotomous factor impacts (e.g., Days With Habit vs. Days Without Habit):

$$d = \frac{|\bar{x}_1 - \bar{x}_2|}{s_{\text{pooled}}}$$

Where the pooled standard deviation $s_{\text{pooled}}$ is defined as:

$$s_{\text{pooled}} = \sqrt{\frac{\sigma_1^2 + \sigma_2^2}{2}}$$

### 5.3. Statistical Confidence Tiers
Every generated factor impact surfaces an explicit confidence tier:

| Confidence Tier | Criteria | Presentation Treatment |
| :--- | :--- | :--- |
| **Insufficient** | $n_1 < 5$ or $n_2 < 5$ | Comparison suppressed; prompts user to record more days. |
| **Low** | $d < 0.2$ | Negligible effect; differences flagged as within normal noise. |
| **Moderate** | $0.2 \le d < 0.5$ OR ($5 \le n_1, n_2 < 10$) | Surfaced with `(limited data)` caveat badge. |
| **High** | $d \ge 0.5$ AND ($n_1 \ge 10$ and $n_2 \ge 10$) | High confidence insight; prominent display in insights feed. |

---

## 6. Lagged Time-Series Analysis ($Lag-1$)

A frequent pitfall in self-tracking analytics is confusing intra-day effects with lagged next-day effects.

### 6.1. Temporal Semantic Alignment
1. **Intra-Day Sleep Impact:**
   In the application schema, an entry on date $t$ records the sleep waking up on morning $t$ alongside the mood and concentration experienced during waking hours of day $t$. Therefore, analyzing `entry.sleepDuration` vs. `entry.concentration` represents the **direct immediate impact of last night's rest on today's focus**.
2. **Lagged Habit Impact ($Lag-1$):**
   Habits performed during waking hours of date $t-1$ (e.g., late-afternoon exercise, evening meditation, caffeine intake) logically precede the sleep recorded on morning $t$.
   The $Lag-1$ engine isolates pairs of entries $(e_{t-1}, e_t)$ satisfying:
   $$\text{diffCalendarDays}(e_{t-1}.\text{date}, e_t.\text{date}) \equiv 1$$
   If two entries are separated by 2 or more days, they are **strictly excluded** from lagged analysis to prevent confounding across unrecorded time intervals.

### 6.2. Cumulative Sleep Debt
When consecutive days are present, the engine assesses multi-day sleep consistency, checking whether low rest across consecutive days ($t-1$ and $t$) triggers superlinear cognitive fatigue.

---

## 7. Statistical Guardrails & Outlier Management

1. **Physiological Range Truncation:**
   Sleep durations outside $[0.0, 18.0]$ hours are flagged as non-physiological data-entry errors and excluded from Pearson correlations.
2. **Interquartile Range (IQR) Outlier Trimming:**
   For continuous metrics with $n \ge 4$, data points outside $[Q_1 - 1.5 \times \text{IQR}, Q_3 + 1.5 \times \text{IQR}]$ are isolated to prevent extreme typos from distorting variances.
3. **Zero-Variance Resilience:**
   When a user records invariant scores across all logged days (e.g., focus = 7 every day), standard deviations collapse to 0. The engine falls back to absolute mean differences with an explicit warning of *"insufficient metric variance"*.

---

## 8. Interpretation Boundaries & Causal Caveats

All product copy and algorithmic recommendations must abide by the following interpretative boundaries:

- **Third-Variable Confounding:** A positive association between morning running and high mood may be driven by pleasant weather or weekend schedules rather than running alone.
- **Reverse Causality:** A negative correlation between sleep duration and mood often indicates that users spend more time in bed when already experiencing depressive episodes or illness. The engine explicitly notes this potential reverse causality in negative sleep-mood correlation summaries.
- **Non-Causal Vocabulary:** Terms like *"causes"*, *"improves"*, *"cures"*, or *"boosts"* are prohibited in automated insights. Permitted phrasing:
  - *"On recorded days, completing [Habit] was associated with..."*
  - *"[Metric A] and [Metric B] show a positive linear association (r = +0.45)..."*
  - *"Nights with higher recorded sleep quality tended to coincide with..."*
