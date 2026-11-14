import type { DailyAgendaPoint } from "@/application/metrics/dashboard";
import { formatNumber } from "@/ui/format";
import { areaChart } from "./area-chart-geometry";

const BOX = { width: 600, height: 220 };

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * Daily agenda visits as an SVG area chart. The drawing is decorative for screen readers; the same
 * numbers are available in the table right below it (WCAG 1.1.1 text alternative).
 */
export function VisitsChart({ series }: { series: DailyAgendaPoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.pageLoads), ...series.map((p) => p.devices));
  const devices = areaChart(
    series.map((p) => p.devices),
    BOX,
    max,
  );
  const loads = areaChart(
    series.map((p) => p.pageLoads),
    BOX,
    max,
  );
  const middle = series[Math.floor(series.length / 2)];

  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        style={{ aspectRatio: `${BOX.width} / ${BOX.height}` }}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-primary)" }} stopOpacity="0.28" />
            <stop offset="100%" style={{ stopColor: "var(--color-primary)" }} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            className="chart__grid"
            x1="0"
            x2={BOX.width}
            y1={BOX.height * f}
            y2={BOX.height * f}
          />
        ))}
        <path className="chart__area" d={devices.area} />
        <path className="chart__line chart__line--secondary" d={loads.line} />
        <path className="chart__line" d={devices.line} />
      </svg>
      {series.length > 0 && (
        <div className="chart__axis" aria-hidden="true">
          <span>{shortDay(series[0]!.day)}</span>
          {middle && <span>{shortDay(middle.day)}</span>}
          <span>{shortDay(series[series.length - 1]!.day)}</span>
        </div>
      )}
      <ul className="legend" aria-hidden="true">
        <li>
          <span className="legend__swatch" /> Acessos à agenda (dispositivos, estimado)
        </li>
        <li>
          <span className="legend__swatch legend__swatch--secondary" /> Carregamentos (medido)
        </li>
      </ul>
      <details className="chart-data">
        <summary>Ver os números por dia</summary>
        <div className="table-wrap" role="region" aria-label="Acessos à agenda por dia" tabIndex={0}>
          <table>
            <caption className="visually-hidden">Acessos à agenda por dia</caption>
            <thead>
              <tr>
                <th scope="col">Dia</th>
                <th scope="col" className="number">
                  Dispositivos
                </th>
                <th scope="col" className="number">
                  Carregamentos
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.day}>
                  <th scope="row">{shortDay(p.day)}</th>
                  <td className="number">{formatNumber(p.devices)}</td>
                  <td className="number">{formatNumber(p.pageLoads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
