// The small heart rate trend line beside the live bpm on the 3D figure: the last couple of minutes
// of samples (one a second at most, from the workout's stream), drawn as one SVG path.

/** How many recent samples the trend shows (about two minutes at one a second). */
export const TREND_SAMPLES = 120;
/** The smallest bpm span the line is scaled to, so a steady heart rate draws a calm line, not noise. */
export const TREND_MIN_SPAN = 12;

/**
 * Points for a trend line `w` wide and `h` tall: the last `TREND_SAMPLES` readings spread evenly
 * across the width, higher bpm higher up, with `pad` kept clear top and bottom for the stroke.
 * Fewer than two readings make no line.
 */
export function trendPoints(samples: readonly number[], w: number, h: number, pad = 1.5): [number, number][] {
  const xs = samples.slice(-TREND_SAMPLES).filter((b) => Number.isFinite(b) && b > 0);
  if (xs.length < 2) return [];
  let lo = Math.min(...xs);
  let hi = Math.max(...xs);
  if (hi - lo < TREND_MIN_SPAN) {
    const mid = (hi + lo) / 2;
    lo = mid - TREND_MIN_SPAN / 2;
    hi = mid + TREND_MIN_SPAN / 2;
  }
  const step = w / (xs.length - 1);
  const round = (n: number) => Math.round(n * 10) / 10;
  return xs.map((b, i) => [round(i * step), round(pad + (1 - (b - lo) / (hi - lo)) * (h - 2 * pad))]);
}

/** A smooth SVG path through the points (midpoint quadratic curves), or "" for no line. */
export function trendPath(points: readonly [number, number][]): string {
  if (points.length < 2) return "";
  const [x0, y0] = points[0]!;
  let d = `M${x0} ${y0}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i]!;
    const [nx, ny] = points[i + 1]!;
    d += ` Q${x} ${y} ${Math.round(((x + nx) / 2) * 10) / 10} ${Math.round(((y + ny) / 2) * 10) / 10}`;
  }
  const [xl, yl] = points[points.length - 1]!;
  return `${d} L${xl} ${yl}`;
}
