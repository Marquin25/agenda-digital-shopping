export interface ChartBox {
  width: number;
  height: number;
}

export interface AreaChartShape {
  points: { x: number; y: number }[];
  /** SVG path of the line. */
  line: string;
  /** SVG path of the line closed down to the baseline, for the filled area. */
  area: string;
  max: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Scales a series into an SVG box: `max` (by default the highest value) touches the top and zero sits
 * on the baseline. Pass the same `max` to several series to draw them on one scale.
 */
export function areaChart(
  values: readonly number[],
  { width, height }: ChartBox,
  max = values.length > 0 ? Math.max(...values) : 0,
): AreaChartShape {
  if (values.length === 0) return { points: [], line: "", area: "", max: 0 };
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((value, i) => ({
    x: round(values.length > 1 ? i * step : width / 2),
    y: round(max > 0 ? height - (value / max) * height : height),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area = `${line} L${last.x} ${height} L${first.x} ${height} Z`;
  return { points, line, area, max };
}
