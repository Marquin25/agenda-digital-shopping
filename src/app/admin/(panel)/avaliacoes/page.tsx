import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { listRatingsForModeration } from "@/application/ratings/ratings";
import { can } from "@/domain/auth/permissions";
import {
  RATING_ATTENDANCE_NOTICE,
  RATING_TAG_LABELS,
  SCORE_LABELS,
  type RatingScore,
} from "@/domain/ratings/rating";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatDateTime } from "@/ui/format";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { setRatingHiddenAction } from "./actions";

export const metadata: Metadata = { title: "Avaliações" };
export const dynamic = "force-dynamic";

/** B-28: staff read ratings and their comments; administrators and editors hide or show them again. */
export default async function RatingsModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; comentarios?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const params = await searchParams;
  const eventId = z.uuid().safeParse(params.evento).data;
  const withComment = params.comentarios === "1";
  const ratings = await listRatingsForModeration(await getDb(), { eventId, withComment });
  const canModerate = can(admin.role, "feedback:moderate");

  return (
    <>
      <h1>Avaliações do público</h1>
      <div className="notice" role="note">
        <p>{RATING_ATTENDANCE_NOTICE}</p>
        <p>
          Comentários são escritos por visitantes e podem conter dados pessoais por engano. Não copie para
          fora do sistema. Avaliações ocultadas saem de todos os indicadores, e cada ocultação fica registrada
          na auditoria.
        </p>
      </div>
      <form method="get" className="toolbar" aria-label="Filtrar avaliações">
        {eventId && <input type="hidden" name="evento" value={eventId} />}
        <label className="choice">
          <input type="checkbox" name="comentarios" value="1" defaultChecked={withComment} />
          <span>Só com comentário</span>
        </label>
        <button type="submit" className="button button--secondary">
          Filtrar
        </button>
        {eventId && <Link href="/admin/avaliacoes">Ver avaliações de todos os eventos</Link>}
      </form>
      <ScrollableTable label="Avaliações recebidas">
        <table>
          <caption>
            {ratings.length} avaliação(ões){eventId ? " deste evento" : ""} · mais recentes primeiro
          </caption>
          <thead>
            <tr>
              <th scope="col">Recebida em</th>
              <th scope="col">Evento</th>
              <th scope="col">Nota</th>
              <th scope="col">Destaques</th>
              <th scope="col">Comentário</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhuma avaliação.</td>
              </tr>
            ) : (
              ratings.map((rating) => (
                <tr key={rating.id}>
                  <td>{formatDateTime(rating.createdAt)}</td>
                  <th scope="row">{rating.eventTitle}</th>
                  <td>
                    {rating.score} · {SCORE_LABELS[rating.score as RatingScore]}
                  </td>
                  <td>{rating.tags.map((t) => RATING_TAG_LABELS[t]).join(", ") || "—"}</td>
                  <td className="rating-comment">{rating.comment ?? "—"}</td>
                  <td>
                    {rating.hidden ? "Oculta" : "Visível"}{" "}
                    {canModerate && (
                      <form
                        className="inline-form"
                        action={setRatingHiddenAction.bind(null, rating.id, !rating.hidden)}
                      >
                        <button
                          type="submit"
                          className="button button--link"
                          aria-label={`${rating.hidden ? "Reexibir" : "Ocultar"} avaliação de ${formatDateTime(rating.createdAt)} sobre ${rating.eventTitle}`}
                        >
                          {rating.hidden ? "Reexibir" : "Ocultar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
