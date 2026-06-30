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
