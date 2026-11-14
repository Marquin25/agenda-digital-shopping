import type { Metadata } from "next";
import Link from "next/link";
import { countSuggestionsByStatus, listSuggestions } from "@/application/suggestions/suggestions";
import { can } from "@/domain/auth/permissions";
import {
  isSuggestionStatus,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUSES,
  type SuggestionStatus,
} from "@/domain/suggestions/suggestion";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { formatDateTime } from "@/ui/format";
import { setSuggestionStatusAction } from "./actions";

export const metadata: Metadata = { title: "Sugestões" };
export const dynamic = "force-dynamic";

const TAB_LABELS: Record<SuggestionStatus, string> = { new: "Novas", read: "Lidas", archived: "Arquivadas" };

/** Next triage steps offered for each state. */
const NEXT: Record<SuggestionStatus, { to: SuggestionStatus; label: string }[]> = {
  new: [
    { to: "read", label: "Marcar como lida" },
    { to: "archived", label: "Arquivar" },
  ],
  read: [
    { to: "archived", label: "Arquivar" },
    { to: "new", label: "Voltar para nova" },
  ],
  archived: [{ to: "read", label: "Desarquivar" }],
};

/** B-29: suggestions wall, visible only to staff. Administrators and editors triage; analysts read. */
export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const requested = (await searchParams).situacao ?? "new";
  const status: SuggestionStatus = isSuggestionStatus(requested) ? requested : "new";
  const db = await getDb();
  const [items, counts] = await Promise.all([listSuggestions(db, { status }), countSuggestionsByStatus(db)]);
  const canTriage = can(admin.role, "feedback:moderate");

  return (
    <>
      <h1>Mural de sugestões</h1>
      <div className="notice" role="note">
        Só a equipe vê as sugestões. Elas são escritas por visitantes e podem conter dados pessoais por
        engano: não copie para fora do sistema. Os temas são os que o visitante escolheu; não há análise
        automática do texto.
      </div>
      <nav aria-label="Situação das sugestões">
        <ul className="actions actions--list">
          {SUGGESTION_STATUSES.map((s) => (
            <li key={s}>
              <Link
                href={`/admin/sugestoes?situacao=${s}`}
                className={s === status ? "button" : "button button--secondary"}
                aria-current={s === status ? "page" : undefined}
              >
                {TAB_LABELS[s]} ({counts[s]})
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollableTable label="Sugestões">
        <table>
          <caption>
            {items.length} · {SUGGESTION_STATUS_LABELS[status]} · mais recentes primeiro
          </caption>
          <thead>
            <tr>
              <th scope="col">Recebida em</th>
              <th scope="col">Sugestão</th>
              <th scope="col">Tema</th>
              {canTriage && <th scope="col">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={canTriage ? 4 : 3}>Nenhuma sugestão.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <th scope="row" className="rating-comment">
                    {item.text}
                  </th>
                  <td>{item.categoryName ?? "Sem tema"}</td>
                  {canTriage && (
                    <td>
                      {NEXT[item.status].map((next) => (
                        <form
                          key={next.to}
                          className="inline-form"
                          action={setSuggestionStatusAction.bind(null, item.id, next.to)}
                        >
                          <button
                            type="submit"
                            className="button button--link"
                            aria-label={`${next.label}: sugestão de ${formatDateTime(item.createdAt)}`}
                          >
                            {next.label}
                          </button>{" "}
                        </form>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
