import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventImport,
  IMPORT_ACTION_LABELS,
  type ImportAction,
  type ImportSummary,
  listImportedEvents,
  previewEventImport,
} from "@/application/events/event-import";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatDateTime } from "@/ui/format";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { discardImportAction } from "../actions";
import { ConfirmForm } from "../import-forms";

export const metadata: Metadata = { title: "Prévia da importação" };
export const dynamic = "force-dynamic";

const ACTION_PILL: Record<ImportAction, string> = {
  create: "pill pill--success",
  update: "pill pill--gold",
  skip: "pill pill--neutral",
  reject: "pill pill--danger",
};

const COUNT_LABELS: [ImportAction, string][] = [
  ["create", "Novos"],
  ["update", "Atualizados"],
  ["skip", "Ignorados"],
  ["reject", "Rejeitados"],
];

export default async function ImportPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("events:manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await getDb();
  const staged = await getEventImport(db, id);
  if (!staged) notFound();

  if (staged.confirmedAt) {
    const summary = staged.summary as unknown as ImportSummary;
    const imported = await listImportedEvents(db, summary.eventIds ?? []);
    return (
      <>
        <h1>Importação concluída</h1>
        <p className="notice notice--success" role="status">
          {summary.created} evento(s) criado(s), {summary.updated} atualizado(s), {summary.skipped}{" "}
          ignorado(s) e {summary.rejected} linha(s) rejeitada(s) de “{staged.fileName}”.
        </p>
        <ul>
          {imported.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/eventos/${e.id}`}>{e.title}</Link>
              {e.status === "draft" ? " (rascunho)" : ""}
            </li>
          ))}
        </ul>
        <p className="actions">
          <Link className="button" href="/admin/eventos">
            Ver eventos
          </Link>
          <Link className="button button--secondary" href="/admin/eventos/importar">
            Importar outra planilha
          </Link>
        </p>
      </>
    );
  }

  const preview = await previewEventImport(db, staged.rows);
  const toImport = preview.counts.create + preview.counts.update;
  const hasIssues = preview.rows.some((r) => r.errors.length > 0 || r.warnings.length > 0);
  return (
    <>
      <p>
        <Link className="back-link" href="/admin/eventos/importar">
          ← Importar eventos
        </Link>
      </p>
      <h1>Prévia da importação</h1>
      <p>Arquivo “{staged.fileName}”. Nada foi gravado ainda: revise e confirme em até 24 horas.</p>
      <ul className="metric-grid" aria-label="Resumo da prévia">
        {COUNT_LABELS.map(([action, label]) => (
          <li key={action} className="metric">
            <span className="metric__label">{label}</span>
            <span className="metric__value">{preview.counts[action]}</span>
          </li>
        ))}
      </ul>
      {preview.fileWarnings.map((w) => (
        <p key={w} className="notice notice--warning">
          {w}
        </p>
      ))}
      {preview.counts.reject > 0 && (
        <p className="notice notice--warning">
          Linhas rejeitadas não serão importadas. Corrija a planilha e envie de novo, ou confirme só as
          válidas.
        </p>
      )}
      <div className="actions">
        {toImport > 0 ? (
          <ConfirmForm importId={id} fingerprint={preview.fingerprint} total={toImport} />
        ) : (
          <p className="notice notice--danger" role="alert">
            Nenhuma linha pode ser importada. Corrija a planilha e envie de novo.
          </p>
        )}
        {hasIssues && (
          <a className="button button--secondary" href={`/admin/eventos/importar/${id}/relatorio.csv`}>
            Baixar relatório de erros (CSV)
          </a>
        )}
        <form action={discardImportAction.bind(null, id)}>
          <button type="submit" className="button button--link">
            Descartar importação
          </button>
        </form>
      </div>
      <ScrollableTable label="Linhas da planilha">
        <table>
          <caption>{preview.rows.length} linha(s) com dados</caption>
          <thead>
            <tr>
              <th scope="col">Linha</th>
              <th scope="col">Resultado</th>
              <th scope="col">Evento</th>
              <th scope="col">Início</th>
              <th scope="col">Espaço</th>
              <th scope="col">Publicar</th>
              <th scope="col">Observações</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.line}>
                <th scope="row">{row.line}</th>
                <td>
                  <span className={ACTION_PILL[row.action]}>{IMPORT_ACTION_LABELS[row.action]}</span>
                </td>
                <td>
                  {row.title || "—"}
                  {row.code && <div className="hint">Código {row.code}</div>}
                </td>
                <td>{row.startsAt ? formatDateTime(row.startsAt) : "—"}</td>
                <td>{row.venueName || "—"}</td>
                <td>{row.publish ? "Sim" : "Não"}</td>
                <td>
                  {row.errors.length + row.warnings.length === 0 ? (
                    "—"
                  ) : (
                    <ul>
                      {row.errors.map((e, i) => (
                        <li key={`e${i}`} className="error">
                          {e.column ? `${e.column}: ` : ""}
                          {e.message}
                        </li>
                      ))}
                      {row.warnings.map((w, i) => (
                        <li key={`w${i}`}>
                          Aviso — {w.column ? `${w.column}: ` : ""}
                          {w.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
