import {
  CalendarCheck,
  CalendarPlus,
  Eye,
  ImageIcon,
  Info,
  Lightbulb,
  MessageSquareText,
  Share2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { getDashboardSummary, type DashboardSummary } from "@/application/metrics/dashboard";
import { SMALL_SAMPLE_THRESHOLD, type Metric } from "@/domain/metrics/metric-quality";
import { TRAFFIC_CHANNEL_LABELS } from "@/domain/metrics/traffic-source";
import { addDaysToDateKey, toLocalDateKey } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { bannerUrl } from "@/ui/banner-image";
import { formatEventWhen, formatNumber } from "@/ui/format";
import { MetricCard, QualityBadge } from "@/ui/admin/metric-card";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { VisitsChart } from "@/ui/admin/visits-chart";
import { StatusBadge } from "@/ui/status-badge";

export const dynamic = "force-dynamic";

const PERIODS = { "7": "7 dias", "30": "30 dias", "90": "90 dias" } as const;
type PeriodKey = keyof typeof PERIODS;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await requireAdmin("dashboard:view");
  const requested = (await searchParams).periodo;
  const periodKey: PeriodKey = requested && requested in PERIODS ? (requested as PeriodKey) : "30";
  const to = toLocalDateKey(new Date());
  const from = addDaysToDateKey(to, -(Number(periodKey) - 1));
  const summary = await getDashboardSummary(await getDb(), { from, to });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Painel</h1>
          <p className="live-dot">Visão geral e desempenho dos eventos · últimos {PERIODS[periodKey]}</p>
        </div>
        <nav aria-label="Período do painel">
          <ul className="segmented">
            {Object.entries(PERIODS).map(([value, label]) => (
              <li key={value}>
                <Link
                  href={`/admin?periodo=${value}`}
                  aria-current={value === periodKey ? "true" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="notice" role="note">
        <Info size={20} className="notice__icon" aria-hidden="true" />
        <p>
          Números <strong>estimados</strong> contam dispositivos (navegadores), não pessoas. Uma pessoa pode
          aparecer mais de uma vez se usar navegadores diferentes (por exemplo, o do Instagram e o do
          celular). <strong>Medidos</strong> são contagens diretas. <strong>Indisponível</strong> indica que a
          fonte ainda não existe — nunca é zero.
        </p>
      </div>

      <h2 className="visually-hidden">Resumo</h2>
      <ul className="metric-grid">
        <li>
          <MetricCard
            label="Acessos à agenda"
            metric={summary.agendaVisitors}
            unit="dispositivos estimados"
            note={`${formatNumber(valueOf(summary.agendaPageLoads))} carregamentos, incl. recarregamentos.`}
            icon={<Eye size={18} />}
          />
        </li>
        <li>
          <MetricCard
            label="Eventos ativos agora"
            metric={summary.activeEvents}
            note="Publicados e ainda não encerrados."
            icon={<CalendarCheck size={18} />}
          />
        </li>
        <li>
          <MetricCard
            label="Compartilhamentos"
            metric={summary.shares}
            unit="dispositivos estimados"
            note="Intenção de compartilhar; não confirma o envio."
            icon={<Share2 size={18} />}
          />
        </li>
        <li>
          <MetricCard
            label="Adições à agenda"
            metric={summary.calendarAdds}
            unit="dispositivos estimados"
            note="Cliques em .ics ou Google; não garante que salvou."
            icon={<CalendarPlus size={18} />}
          />
        </li>
        <li>
          <MetricCard
            label="Interessados"
            metric={summary.interested}
            unit="dispositivos estimados"
            note="“Tenho interesse” ativos nos eventos do período. Não é reserva nem presença."
            icon={<Star size={18} />}
          />
        </li>
        <li>
          <MetricCard
            label="Avaliações"
            metric={summary.ratings}
            unit="envios"
            note="Recebidas no período, sem as ocultadas pela moderação. Sem check-in, não comprovam presença."
            icon={<MessageSquareText size={18} />}
          />
        </li>
      </ul>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="acessos-tempo">
          <div className="card__header">
            <div>
              <h2 id="acessos-tempo">Acessos ao longo do tempo</h2>
              <p className="hint">Acessos únicos e carregamentos da agenda, dia a dia.</p>
            </div>
            <QualityBadge quality="estimated" />
          </div>
          <VisitsChart series={summary.agendaDaily} />
        </section>

        <ChannelsCard summary={summary} />
      </div>

      <section aria-labelledby="indisponiveis">
        <h2 id="indisponiveis">Indicadores que ainda não têm fonte</h2>
        <ul className="unavailable-list">
          {(
            [
              ["Check-ins", summary.checkIns],
              ["Fluxo de visitantes", summary.footfall],
              ["Vendas", summary.sales],
            ] as const
          ).map(([label, metric]) => (
            <li key={label}>
              <strong>
                {label} <QualityBadge quality={metric.quality} />
              </strong>
              {metric.quality === "unavailable" && <span className="reason">{metric.reason}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="eventos-desempenho" style={{ marginBottom: "1.5rem" }}>
        <div className="card__header">
          <div>
            <h2 id="eventos-desempenho">Eventos e desempenho</h2>
            <p className="hint">
              Eventos com acessos no período, do mais visto para o menos visto. Carregamentos{" "}
              <QualityBadge quality="measured" />; demais colunas <QualityBadge quality="estimated" />.
            </p>
          </div>
          <Link href="/admin/eventos" className="button button--secondary">
            Ver todos os eventos
          </Link>
        </div>
        <ScrollableTable label="Visualizações por evento">
          <table>
            <caption className="visually-hidden">Visualizações por evento</caption>
            <thead>
              <tr>
                <th scope="col">Evento</th>
                <th scope="col" className="number">
                  Dispositivos
                </th>
                <th scope="col" className="number">
                  Carregamentos
                </th>
                <th scope="col" className="number">
                  Compartilhamentos
                </th>
                <th scope="col" className="number">
                  Agenda .ics
                </th>
                <th scope="col" className="number">
                  Google Agenda
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.eventViews.length === 0 ? (
                <tr>
                  <td colSpan={7}>Sem dados no período.</td>
                </tr>
              ) : (
                summary.eventViews.map((e) => (
                  <tr key={e.eventId}>
                    <th scope="row">
                      <div className="table-event">
                        {e.bannerPath ? (
                          // eslint-disable-next-line @next/next/no-img-element -- small local WebP thumbnail
                          <img
                            className="table-event__thumb"
                            src={bannerUrl(e.bannerPath)}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="table-event__thumb table-event__thumb--placeholder"
                            aria-hidden="true"
                          >
                            <ImageIcon size={18} />
                          </span>
                        )}
                        <div>
                          <Link href={`/eventos/${e.slug}`}>{e.title}</Link>
                          <small>
                            {e.categoryName} · {[e.venue.floor, e.venue.name].filter(Boolean).join(" · ")}
                          </small>
                          <small>{formatEventWhen(e.startsAt, e.endsAt)}</small>
                          {e.stores.length > 0 && <small>Lojas: {e.stores.join(", ")}</small>}
                        </div>
                      </div>
                    </th>
                    <td className="number">{formatNumber(e.devices)}</td>
                    <td className="number">{formatNumber(e.pageLoads)}</td>
                    <td className="number">{formatNumber(e.shares)}</td>
                    <td className="number">{formatNumber(e.calendarIcs)}</td>
                    <td className="number">{formatNumber(e.calendarGoogle)}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      <section className="card" aria-labelledby="links-divulgacao">
        <div className="card__header">
          <div>
            <h2 id="links-divulgacao">Acessos por link e QR de divulgação</h2>
            <p className="hint">Contam aberturas, não pessoas. Ações da equipe logada não são contadas.</p>
          </div>
          <QualityBadge quality="measured" />
        </div>
        <ScrollableTable label="Acessos por link e QR de divulgação">
          <table>
            <caption className="visually-hidden">Acessos por link e QR de divulgação</caption>
            <thead>
              <tr>
                <th scope="col">Link</th>
                <th scope="col">Canal</th>
                <th scope="col" className="number">
                  Acessos
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.promoLinks.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nenhum link de divulgação ativo.</td>
                </tr>
              ) : (
                summary.promoLinks.map((l) => (
                  <tr key={l.id}>
                    <th scope="row">
                      {l.description} <code>/r/{l.code}</code>
                    </th>
                    <td>
                      {TRAFFIC_CHANNEL_LABELS[l.channel as keyof typeof TRAFFIC_CHANNEL_LABELS] ?? l.channel}
                    </td>
                    <td className="number">{formatNumber(l.hits)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </section>
    </>
  );
}

const valueOf = (metric: Metric) => (metric.quality === "unavailable" ? 0 : metric.value);

function ChannelsCard({ summary }: { summary: DashboardSummary }) {
  const total = summary.sources.reduce((sum, s) => sum + s.devices, 0);
  const top = summary.sources[0];
  return (
    <section className="card" aria-labelledby="canais">
      <div className="card__header">
        <div>
          <h2 id="canais">Canais de divulgação</h2>
          <p className="hint">Por onde as pessoas chegaram à agenda e aos eventos.</p>
        </div>
      </div>
      <ScrollableTable label="Origem dos acessos">
        <table className="channel-table">
          <caption className="visually-hidden">Origem dos acessos (estimado)</caption>
          <thead className="visually-hidden">
            <tr>
              <th scope="col">Canal</th>
              <th scope="col" className="number">
                Dispositivos
              </th>
              <th scope="col" className="number">
                %
              </th>
              <th scope="col">Proporção</th>
            </tr>
          </thead>
          <tbody>
            {summary.sources.length === 0 ? (
              <tr>
                <td colSpan={4}>Sem dados no período.</td>
              </tr>
            ) : (
              summary.sources.map((s) => {
                const share = total ? (s.devices / total) * 100 : 0;
                return (
                  <tr key={s.channel}>
                    <th scope="row">{TRAFFIC_CHANNEL_LABELS[s.channel] ?? s.channel}</th>
                    <td className="number">{formatNumber(s.devices)}</td>
                    <td className="number">{share.toFixed(0)}%</td>
                    <td aria-hidden="true">
                      <span className="bar-track">
                        <span className="bar" style={{ width: `${share}%` }} />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollableTable>
      {total > 0 && total < SMALL_SAMPLE_THRESHOLD && (
        <p className="notice notice--warning" style={{ marginTop: "1rem" }}>
          Amostra pequena (n = {total}): interprete com cautela.
        </p>
      )}
      {top && total >= SMALL_SAMPLE_THRESHOLD && (
        <div className="insight">
          <Lightbulb size={20} aria-hidden="true" />
          <p>
            <strong>{TRAFFIC_CHANNEL_LABELS[top.channel] ?? top.channel}</strong> trouxe{" "}
            {((top.devices / total) * 100).toFixed(0)}% dos acessos no período.
          </p>
        </div>
      )}
    </section>
  );
}
