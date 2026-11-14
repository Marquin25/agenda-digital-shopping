import Link from "next/link";
import type {
  Confidence,
  Recommendation,
  RecommendationResult,
} from "@/application/intelligence/recommendations";
import { INDICATORS } from "@/domain/intelligence/experience-catalog";
import { formatCostRange } from "@/ui/format";

/** Fixed notice required by docs/spec/10 §3.4. */
export const RECOMMENDATION_DISCLAIMER =
  "Sugestões baseadas nas regras e nos dados informados. Não são previsões nem garantias de resultado.";

const CONFIDENCE: Record<Confidence, { label: string; hint: string; tone: string }> = {
  low: { label: "Confiança baixa", hint: "só regras, sem histórico suficiente", tone: "pill--neutral" },
  medium: { label: "Confiança média", hint: "regras e histórico mínimo", tone: "pill--gold" },
  high: { label: "Confiança alta", hint: "regras e histórico amplo", tone: "pill--success" },
};

const INDICATOR_LABELS = new Map<string, { label: string; measured: boolean }>(
  INDICATORS.map((i) => [i.key, { label: i.label, measured: i.measured }]),
);

export interface RecommendationListProps {
  result: RecommendationResult;
  venueNames: Record<string, string>;
  /** Active stores, used to list the ones in each idea's segments. */
  stores: { id: string; name: string; segmentId: number }[];
  /** Link to create an event from an idea; null when the viewer cannot create events. */
  createEventHref: ((recommendation: Recommendation) => string) | null;
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="hint">{empty}</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function RecommendationList({ result, venueNames, stores, createEventHref }: RecommendationListProps) {
  return (
    <>
      <p className="notice notice--warning" role="note">
        {RECOMMENDATION_DISCLAIMER}
      </p>
      {result.recommendations.length === 0 ? (
        <p className="empty-state">Nenhuma ideia do catálogo atende a este planejamento.</p>
      ) : (
        <ol className="recommendation-list" aria-label="Ideias sugeridas">
          {result.recommendations.map((r, index) => {
            const confidence = CONFIDENCE[r.confidence];
            const storeNames = stores
              .filter((s) => r.matchedSegmentIds.includes(s.segmentId))
              .map((s) => s.name);
            return (
              <li key={r.templateId} className="card">
                <div className="card__header">
                  <div>
                    <h3>
                      {index + 1}. {r.name}
                    </h3>
                    <p>Aderência às regras: {Math.round(r.score * 100)}%</p>
                  </div>
                  <span className={`pill ${confidence.tone}`} title={confidence.hint}>
                    {confidence.label}
                  </span>
                </div>
                <dl className="template-facts">
                  <dt>Por que foi sugerida</dt>
                  <dd>
                    <List items={r.reasons} empty="Sem regras que pontuaram." />
                  </dd>
                  <dt>Premissas</dt>
                  <dd>
                    <List items={r.assumptions} empty="Nenhuma premissa registrada." />
                  </dd>
                  <dt>Lojas que poderiam participar</dt>
                  <dd>
                    <List items={storeNames} empty="Nenhuma loja cadastrada nos segmentos desta ideia." />
                  </dd>
                  <dt>Espaços compatíveis</dt>
                  <dd>
                    <List
                      items={r.compatibleVenueIds.map((id) => venueNames[id] ?? "Espaço removido")}
                      empty="Nenhum espaço compatível."
                    />
                  </dd>
                  <dt>Faixa de custo informada</dt>
                  <dd>{formatCostRange(r.costMin, r.costMax)}</dd>
                  <dt>Indicadores para medir</dt>
                  <dd>
                    <List
                      items={r.indicators.map((key) => {
                        const indicator = INDICATOR_LABELS.get(key);
                        if (!indicator) return key;
                        return indicator.measured ? indicator.label : `${indicator.label} (ainda não medido)`;
                      })}
                      empty="Nenhum indicador sugerido."
                    />
                  </dd>
                  <dt>Nível de confiança</dt>
                  <dd>
                    {confidence.label}: {confidence.hint}.
                  </dd>
                </dl>
                {createEventHref && (
                  <p>
                    <Link className="button button--secondary" href={createEventHref(r)}>
                      Criar evento com esta ideia
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {result.eliminated.length > 0 && (
        <details>
          <summary>Ideias descartadas ({result.eliminated.length})</summary>
          <ul>
            {result.eliminated.map((e) => (
              <li key={e.templateId}>
                <strong>{e.name}</strong>: {e.reasons.join("; ")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
