import type { EventRatingReport } from "@/application/ratings/ratings";
import { SMALL_SAMPLE_THRESHOLD } from "@/domain/metrics/metric-quality";
import {
  RATING_ATTENDANCE_NOTICE,
  RATING_SCORES,
  RATING_TAG_LABELS,
  RATING_TAGS,
  SCORE_LABELS,
  type RatingWindow,
} from "@/domain/ratings/rating";
import { formatDateTime, formatNumber } from "@/ui/format";
import { MetricCard } from "./metric-card";
import { ScrollableTable } from "./scrollable-table";

const percent = (share: number) => `${Math.round(share * 100)}%`;

/**
 * Staff view of an event's ratings (B-26): aggregates only, each number with its quality label,
 * sample size and how it is calculated (docs/spec/03 §1, §5). Never shows device data.
 */
export function RatingSummary({ report, window }: { report: EventRatingReport; window: RatingWindow }) {
  const { summary } = report;
  const unavailable = { quality: "unavailable" as const, reason: "Sem avaliações ainda." };
  return (
    <section aria-labelledby="avaliacoes" className="panel" style={{ marginBottom: "1.5rem" }}>
      <h2 id="avaliacoes">Avaliações do público</h2>
      <p className="hint">
        Período de avaliação: de {formatDateTime(window.opensAt)} até {formatDateTime(window.closesAt)}.
      </p>
      <p className="notice" role="note">
        {RATING_ATTENDANCE_NOTICE}
      </p>
      <ul className="metric-grid">
        <li>
          <MetricCard
            label="Avaliações"
            metric={{ quality: "measured", value: summary.count }}
            unit="envios"
            note="Quem avalia escolhe avaliar (autosseleção): não representa todo o público."
          />
        </li>
        <li>
          <MetricCard
            label="CSAT (notas 4 e 5)"
            metric={
              summary.csat === null
                ? unavailable
                : { quality: "estimated", value: Math.round(summary.csat * 100), sampleSize: summary.count }
            }
            unit={`% · n = ${summary.count}`}
            note="Satisfação, não é NPS."
          />
        </li>
        <li>
          <MetricCard
            label="Nota média"
            metric={
              summary.average === null
                ? unavailable
                : { quality: "estimated", value: summary.average, sampleSize: summary.count }
            }
            unit={`de 5 · n = ${summary.count}`}
          />
        </li>
      </ul>
      {summary.count > 0 && summary.count < SMALL_SAMPLE_THRESHOLD && (
        <p className="notice notice--warning" style={{ marginTop: "1rem" }}>
          Amostra pequena (n = {summary.count}): interprete com cautela.
        </p>
      )}
      {summary.count > 0 && (
        <>
          <ScrollableTable label="Distribuição das notas">
            <table>
              <caption>Distribuição das notas</caption>
              <thead>
                <tr>
                  <th scope="col">Nota</th>
                  <th scope="col">Avaliações</th>
                  <th scope="col">Parcela</th>
                </tr>
              </thead>
              <tbody>
                {[...RATING_SCORES].reverse().map((score) => (
                  <tr key={score}>
                    <th scope="row">
                      {score} · {SCORE_LABELS[score]}
                    </th>
                    <td>{formatNumber(summary.distribution[score])}</td>
                    <td>{percent(summary.distribution[score] / summary.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
          <ScrollableTable label="Destaques marcados">
            <table>
              <caption>O que se destacou (pode marcar mais de um)</caption>
              <thead>
                <tr>
                  <th scope="col">Destaque</th>
                  <th scope="col">Avaliações que marcaram</th>
                </tr>
              </thead>
              <tbody>
                {RATING_TAGS.map((tag) => (
                  <tr key={tag}>
                    <th scope="row">{RATING_TAG_LABELS[tag]}</th>
                    <td>{formatNumber(report.tags[tag])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        </>
      )}
      <details>
        <summary>Como calculamos</summary>
        <ul>
          <li>
            <strong>Avaliações (Medido):</strong> contagem de envios, um por aparelho e evento. Fonte:
            formulário de avaliação.
          </li>
          <li>
            <strong>CSAT (Estimado):</strong> avaliações com nota 4 ou 5 ÷ total de avaliações, com o tamanho
            da amostra (n). É uma amostra de quem quis avaliar.
          </li>
          <li>
            <strong>Nota média (Estimado):</strong> soma das notas ÷ n, com uma casa decimal.
          </li>
          <li>
            Limitações: sem check-in, uma avaliação não comprova que a pessoa esteve no evento; a mesma pessoa
            pode avaliar de aparelhos diferentes.
          </li>
          {report.hiddenCount > 0 && (
            <li>
              {formatNumber(report.hiddenCount)} avaliação(ões) ocultada(s) pela moderação ficam fora destes
              números.
            </li>
          )}
        </ul>
      </details>
    </section>
  );
}
