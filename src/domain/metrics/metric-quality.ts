/** Every number shown to staff carries one of these labels (docs/spec/03 §1). */
export type MetricQuality = "measured" | "estimated" | "unavailable";

export const METRIC_QUALITY_LABELS: Record<MetricQuality, string> = {
  measured: "Medido",
  estimated: "Estimado",
  unavailable: "Indisponível",
};

export type Metric =
  | { quality: "measured" | "estimated"; value: number; sampleSize?: number }
  | { quality: "unavailable"; reason: string };

export const SMALL_SAMPLE_THRESHOLD = 10;
