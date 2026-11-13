import { METRIC_QUALITY_LABELS, type Metric } from "@/domain/metrics/metric-quality";
import { formatNumber } from "@/ui/format";

export function QualityBadge({ quality }: { quality: Metric["quality"] }) {
  return <span className={`quality quality--${quality}`}>{METRIC_QUALITY_LABELS[quality]}</span>;
}

export function MetricCard({
  label,
  metric,
  unit,
  note,
}: {
  label: string;
  metric: Metric;
  /** Short unit shown under the number, e.g. "dispositivos estimados". */
  unit?: string;
  /** Caveat on how to read the number. */
  note?: string;
}) {
  return (
    <div className="metric">
      <p className="metric__label">{label}</p>
      {metric.quality === "unavailable" ? (
        <>
          <p className="metric__value" aria-label="Indisponível">
            —
          </p>
          <p className="hint">{metric.reason}</p>
        </>
      ) : (
        <>
          <p className="metric__value">
            {formatNumber(metric.value)}
            {unit && <span className="metric__unit"> {unit}</span>}
          </p>
          {note && <p className="hint">{note}</p>}
        </>
      )}
      <QualityBadge quality={metric.quality} />
    </div>
  );
}
