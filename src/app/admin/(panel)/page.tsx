import Link from "next/link";
import { getDashboardSummary } from "@/application/metrics/dashboard";
import { SMALL_SAMPLE_THRESHOLD } from "@/domain/metrics/metric-quality";
import { TRAFFIC_CHANNEL_LABELS } from "@/domain/metrics/traffic-source";
import { addDaysToDateKey, toLocalDateKey } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatNumber } from "@/ui/format";
import { MetricCard, QualityBadge } from "@/ui/admin/metric-card";
import { ScrollableTable } from "@/ui/admin/scrollable-table";

export const dynamic = "force-dynamic";

const PERIODS = { "7": "Últimos 7 dias", "30": "Últimos 30 dias", "90": "Últimos 90 dias" } as const;
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
  const totalSourceDevices = summary.sources.reduce((sum, s) => sum + s.devices, 0);

  return (
    <>
      <h1>Painel</h1>
      <form method="get" className="toolbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="periodo">Período</label>
          <select id="periodo" name="periodo" defaultValue={periodKey}>
            {Object.entries(PERIODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="button button--secondary">
          Atualizar
        </button>
      </form>

      <div className="notice" role="note">
        Números <strong>estimados</strong> contam dispositivos (navegadores), não pessoas. Uma pessoa pode
        aparecer mais de uma vez se usar navegadores diferentes (por exemplo, o do Instagram e o do celular).{" "}
        <strong>Medidos</strong> são contagens diretas. <strong>Indisponível</strong> indica que a fonte ainda
        não existe — nunca é zero.
      </div>

      <h2>Resumo</h2>
      <ul className="metric-grid">
        <li>
          <MetricCard
            label="Acessos à agenda"
            metric={summary.agendaVisitors}
            unit="dispositivos estimados"
          />
        </li>
        <li>
          <MetricCard
            label="Carregamentos da agenda"
            metric={summary.agendaPageLoads}
            unit="incl. recarregamentos"
          />
        </li>
        <li>
          <MetricCard label="Eventos ativos agora" metric={summary.activeEvents} />
        </li>
        <li>
          <MetricCard
            label="Compartilhamentos"
            metric={summary.shares}
            unit="dispositivos estimados"
            note="Intenção de compartilhar; não confirma o envio."
          />
        </li>
        <li>
          <MetricCard
            label="Adições à agenda"
            metric={summary.calendarAdds}
            unit="dispositivos estimados"
            note="Cliques em .ics ou Google; não garante que salvou."
          />
        </li>
        <li>
          <MetricCard label="Interessados" metric={summary.interested} />
        </li>
        <li>
          <MetricCard label="Check-ins" metric={summary.checkIns} />
        </li>
        <li>
          <MetricCard label="Avaliações" metric={summary.ratings} />
        </li>
        <li>
          <MetricCard label="Fluxo de visitantes" metric={summary.footfall} />
        </li>
        <li>
          <MetricCard label="Vendas" metric={summary.sales} />
        </li>
      </ul>

      <ScrollableTable label="Origem dos acessos">
        <table>
          <caption>
            Origem dos acessos <QualityBadge quality="estimated" />
          </caption>
          <thead>
            <tr>
              <th scope="col">Canal</th>
              <th scope="col" className="number">
                Dispositivos
              </th>
              <th scope="col" className="number">
                %
              </th>
              <th scope="col" aria-hidden="true">
                <span className="visually-hidden">Proporção</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.sources.length === 0 ? (
              <tr>
                <td colSpan={4}>Sem dados no período.</td>
              </tr>
            ) : (
              summary.sources.map((s) => {
                const share = totalSourceDevices ? (s.devices / totalSourceDevices) * 100 : 0;
                return (
                  <tr key={s.channel}>
                    <th scope="row">{TRAFFIC_CHANNEL_LABELS[s.channel] ?? s.channel}</th>
                    <td className="number">{formatNumber(s.devices)}</td>
                    <td className="number">{share.toFixed(0)}%</td>
                    <td aria-hidden="true" style={{ width: "30%" }}>
                      <span className="bar" style={{ width: `${share}%` }} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollableTable>
      {totalSourceDevices > 0 && totalSourceDevices < SMALL_SAMPLE_THRESHOLD && (
        <p className="notice notice--warning">
          Amostra pequena (n = {totalSourceDevices}): interprete com cautela.
        </p>
      )}

      <ScrollableTable label="Visualizações por evento">
        <table>
          <caption>Visualizações por evento</caption>
          <thead>
            <tr>
              <th scope="col">Evento</th>
              <th scope="col" className="number">
                Dispositivos <QualityBadge quality="estimated" />
              </th>
              <th scope="col" className="number">
                Carregamentos <QualityBadge quality="measured" />
              </th>
              <th scope="col" className="number">
                Compartilhamentos <QualityBadge quality="estimated" />
              </th>
              <th scope="col" className="number">
                Agenda .ics <QualityBadge quality="estimated" />
              </th>
              <th scope="col" className="number">
                Google Agenda <QualityBadge quality="estimated" />
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.eventViews.length === 0 ? (
              <tr>
                <td colSpan={6}>Sem dados no período.</td>
              </tr>
            ) : (
              summary.eventViews.map((e) => (
                <tr key={e.eventId}>
                  <th scope="row">
                    <Link href={`/eventos/${e.slug}`}>{e.title}</Link>
                  </th>
                  <td className="number">{formatNumber(e.devices)}</td>
                  <td className="number">{formatNumber(e.pageLoads)}</td>
                  <td className="number">{formatNumber(e.shares)}</td>
                  <td className="number">{formatNumber(e.calendarIcs)}</td>
                  <td className="number">{formatNumber(e.calendarGoogle)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>

      <ScrollableTable label="Acessos por link e QR de divulgação">
        <table>
          <caption>
            Acessos por link e QR de divulgação <QualityBadge quality="measured" />
          </caption>
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
      <p className="hint">
        Acessos aos links contam aberturas, não pessoas. Ações da equipe logada não são contadas.
      </p>
    </>
  );
}
