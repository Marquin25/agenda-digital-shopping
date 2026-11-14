import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { listRateableEvents } from "@/application/ratings/ratings";
import { RATING_ATTENDANCE_NOTICE } from "@/domain/ratings/rating";
import { getDb } from "@/infrastructure/db";
import { currentDeviceHash } from "@/infrastructure/web/visitor-device";
import { formatDateTime } from "@/ui/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Encerrados recentes",
  description: "Eventos que acabaram há pouco e ainda podem ser avaliados.",
};

/** B-27 (docs/spec/02 `/eventos/encerrados`): recently ended events still open for rating. */
export default async function RecentlyEndedPage() {
  const events = await listRateableEvents(await getDb(), { deviceHash: await currentDeviceHash() });

  return (
    <div className="rating-page">
      <p>
        <Link href="/" className="back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Agenda
        </Link>
      </p>
      <h1>Encerrados recentes</h1>
      <p>
        Eventos que acabaram há pouco. Se você esteve em algum, conte como foi: leva menos de 30 segundos e
        não precisa de cadastro.
      </p>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum evento aberto para avaliação agora.</p>
          <p>
            <Link href="/">Ver a agenda</Link>
          </p>
        </div>
      ) : (
        <ul className="ended-list">
          {events.map((event) => (
            <li key={event.eventId} className="ended-list__item">
              <h2>
                <Link href={`/eventos/${event.slug}`}>{event.title}</Link>
              </h2>
              <p className="hint">
                Terminou em {formatDateTime(event.endedAt)} · avaliação aberta até{" "}
                {formatDateTime(event.closesAt)}
              </p>
              {event.rated ? (
                <p className="ended-list__done">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Você já avaliou este evento neste aparelho.
                </p>
              ) : (
                <Link href={`/eventos/${event.slug}/avaliar`} className="button button--secondary">
                  <Star size={18} aria-hidden="true" />
                  Avaliar <span className="visually-hidden">{event.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="hint">{RATING_ATTENDANCE_NOTICE}</p>
    </div>
  );
}
