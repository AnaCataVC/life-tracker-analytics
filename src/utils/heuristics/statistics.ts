/**
 * Pure statistical utility functions for the well-being heuristics engine.
 * All functions are side-effect free and operate on plain number arrays.
 */

/** Minimum number of data points required in each group before computing comparisons. */
export const MIN_SAMPLE_SIZE = 5;

/** Confidence tier based on sample size and effect magnitude. */
export type ConfidenceLevel = "high" | "moderate" | "low" | "insufficient";

/**
 * Calculates the arithmetic mean of an array of numbers.
 * Returns 0 for empty arrays to avoid division-by-zero errors.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculates the population standard deviation of an array.
 * Returns 0 for arrays with fewer than 2 elements.
 */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Computes the Pearson correlation coefficient between two equal-length arrays.
 * Returns 0 if inputs are too short or have zero variance.
 *
 * @returns r in [-1, 1]
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < MIN_SAMPLE_SIZE || n !== ys.length) return 0;

  const mx = mean(xs);
  const my = mean(ys);
  const sdX = stdDev(xs);
  const sdY = stdDev(ys);

  if (sdX === 0 || sdY === 0) return 0;

  const covariance = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0) / n;
  return parseFloat((covariance / (sdX * sdY)).toFixed(3));
}

/**
 * Checks whether both groups have a statistically meaningful sample size
 * (>= MIN_SAMPLE_SIZE) to allow a reliable group comparison.
 */
export function hasSufficientSamples(groupA: unknown[], groupB: unknown[], minN = MIN_SAMPLE_SIZE): boolean {
  return groupA.length >= minN && groupB.length >= minN;
}

/**
 * Computes a simplified Cohen's d effect size between two groups.
 * Uses pooled population standard deviation.
 *
 * @returns |d| (unsigned effect size)
 */
export function effectSize(valuesA: number[], valuesB: number[]): number {
  const ma = mean(valuesA);
  const mb = mean(valuesB);
  const sdA = stdDev(valuesA);
  const sdB = stdDev(valuesB);
  const pooledSd = Math.sqrt((sdA ** 2 + sdB ** 2) / 2);
  if (pooledSd === 0) return 0;
  return Math.abs((ma - mb) / pooledSd);
}

/**
 * Determines the confidence tier for an insight based on group sizes and effect magnitude.
 *
 * Tiers:
 * - "insufficient": either group has fewer than MIN_SAMPLE_SIZE entries.
 * - "low":          effect size < 0.2 (negligible difference even with enough data).
 * - "moderate":     effect size 0.2–0.5 OR sample sizes are small-ish (5–9 each).
 * - "high":         effect size > 0.5 AND both groups have >= 10 entries.
 */
export function confidenceLevel(
  groupASize: number,
  groupBSize: number,
  d: number
): ConfidenceLevel {
  if (groupASize < MIN_SAMPLE_SIZE || groupBSize < MIN_SAMPLE_SIZE) return "insufficient";
  if (d < 0.2) return "low";
  if (d >= 0.5 && groupASize >= 10 && groupBSize >= 10) return "high";
  return "moderate";
}

/**
 * Maps a Pearson r value to a human-readable direction string.
 * Uses a threshold of |r| >= 0.2 to declare a non-neutral trend.
 */
export function pearsonDirection(r: number): "positive" | "negative" | "neutral" {
  if (r >= 0.2) return "positive";
  if (r <= -0.2) return "negative";
  return "neutral";
}

/**
 * Formats a Pearson r value for display in descriptions.
 * Example: 0.72 → "r = +0.72", -0.41 → "r = −0.41"
 */
export function formatPearsonR(r: number): string {
  const sign = r >= 0 ? "+" : "−";
  return `r = ${sign}${Math.abs(r).toFixed(2)}`;
}

/**
 * Calculates a rolling average across an array of nullable numbers.
 * Missing days are explicitly represented as `null` and are NOT coerced to zero.
 * 
 * @param values Array of numbers or null for missing dates
 * @param windowSize Number of days in the rolling window (e.g. 7 or 28)
 * @param minObservations Minimum non-null values required in the window to compute an average (defaults to Math.ceil(windowSize / 2))
 */
export function rollingAverage(
  values: (number | null)[],
  windowSize: number,
  minObservations = Math.ceil(windowSize / 2)
): (number | null)[] {
  if (windowSize <= 0) return values.map(() => null);

  const result: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = values.slice(windowStart, i + 1).filter((v): v is number => v !== null && !isNaN(v));

    if (window.length < minObservations) {
      result.push(null);
    } else {
      const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
      result.push(parseFloat(avg.toFixed(2)));
    }
  }

  return result;
}

/**
 * Calculates the deviation and z-score of a current value against a historical baseline.
 */
export function calculateBaselineDeviation(
  currentValue: number,
  baselineValues: number[]
): {
  delta: number;
  zScore: number | null;
  direction: "above" | "below" | "baseline";
} {
  const clean = baselineValues.filter((v) => typeof v === "number" && !isNaN(v));
  if (clean.length === 0) {
    return { delta: 0, zScore: null, direction: "baseline" };
  }

  const baselineMean = mean(clean);
  const baselineSd = stdDev(clean);
  const delta = parseFloat((currentValue - baselineMean).toFixed(2));

  let zScore: number | null = null;
  if (baselineSd > 0) {
    zScore = parseFloat(((currentValue - baselineMean) / baselineSd).toFixed(2));
  }

  let direction: "above" | "below" | "baseline" = "baseline";
  if (delta > 0.25) direction = "above";
  else if (delta < -0.25) direction = "below";

  return { delta, zScore, direction };
}

/**
 * Robust outlier filtering using the Interquartile Range (IQR) method.
 * Values outside [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR] are excluded.
 * For arrays with fewer than 4 elements, returns the array unchanged.
 */
export function filterOutliersIQR(values: number[]): number[] {
  const valid = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (valid.length < 4) return valid;

  const sorted = [...valid].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) return sorted;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sorted.filter((v) => v >= lowerBound && v <= upperBound);
}

/**
 * Helper to compute an approximate quantile on a sorted array of numbers.
 */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}
