import type { Metadata } from "next";
import Link from "next/link";
import { IMPORT_COLUMNS, IMPORT_LIMITS } from "@/domain/events/event-import";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { UploadForm } from "./import-forms";

export const metadata: Metadata = { title: "Importar eventos" };
export const dynamic = "force-dynamic";

export default async function ImportEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ descartada?: string }>;
}) {
  await requireAdmin("events:manage");
  const params = await searchParams;
  return (
    <>
      <p>
        <Link className="back-link" href="/admin/eventos">
          ← Eventos
        </Link>
      </p>
      <h1>Importar eventos de planilha</h1>
      {params.descartada && (
        <p className="notice notice--success" role="status">
          Importação descartada. Nenhum evento foi alterado.
        </p>
      )}
      <section className="card" aria-labelledby="como-funciona">
        <h2 id="como-funciona">Como funciona</h2>
        <ol>
          <li>
            Baixe o <a href="/admin/eventos/importar/modelo.csv">modelo de planilha (CSV)</a> e preencha uma
            linha por evento. Pode salvar como .xlsx ou como “CSV UTF-8”.
          </li>
          <li>Envie o arquivo. O sistema valida tudo e mostra uma prévia — nada é gravado ainda.</li>
          <li>
            Revise a prévia e confirme. Só então os eventos aparecem (os marcados para publicar) na agenda.
          </li>
        </ol>
        <ul>
          <li>
            Até {IMPORT_LIMITS.maxRows} eventos e 1 MB por arquivo. Só a primeira aba do .xlsx é lida;
            fórmulas valem pelo valor salvo e macros não são aceitas.
          </li>
          <li>
            Com <strong>Código</strong>, a linha atualiza o evento importado antes com o mesmo código. Sem
            código, a linha é ignorada se já existir evento com o mesmo título, início e espaço.
          </li>
          <li>
            Espaços, categorias, lojas e recursos de acessibilidade precisam estar cadastrados; a planilha não
            cria nem altera cadastros, usuários ou configurações.
          </li>
          <li>Banners não são importados: adicione a imagem depois, na página do evento.</li>
        </ul>
      </section>
      <section className="card" aria-labelledby="enviar">
        <h2 id="enviar">Enviar planilha</h2>
        <UploadForm />
      </section>
      <section aria-labelledby="colunas">
        <h2 id="colunas">Colunas do modelo</h2>
        <ScrollableTable label="Colunas do modelo de importação">
          <table>
            <caption>* coluna obrigatória</caption>
            <thead>
              <tr>
                <th scope="col">Coluna</th>
                <th scope="col">Formato</th>
                <th scope="col">Exemplo</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_COLUMNS.map((c) => (
                <tr key={c.key}>
                  <th scope="row">
                    {c.header}
                    {c.required && <span aria-label=" (obrigatória)">*</span>}
                  </th>
                  <td>{c.format}</td>
                  <td>{c.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </section>
    </>
  );
}
