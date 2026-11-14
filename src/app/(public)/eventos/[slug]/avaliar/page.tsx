import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRatingContext, hasRated } from "@/application/ratings/ratings";
import { getDb } from "@/infrastructure/db";
import { currentDeviceHash } from "@/infrastructure/web/visitor-device";
import { formatDateTime } from "@/ui/format";
import { RatingForm } from "@/ui/public/rating-form";
import { submitRatingAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Avaliar evento", robots: { index: false } };

/** Post-event rating (B-26): open from the end of the event for its rating period; no check-in needed. */
export default async function RatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const context = await getRatingContext(db, slug);
  if (!context) notFound();
  const deviceHash = await currentDeviceHash();
  const alreadyRated = deviceHash !== null && (await hasRated(db, context.eventId, deviceHash));
  // Server component rendered per request: this instant is when the form was shown (minimum filling time).
  // eslint-disable-next-line react-hooks/purity
  const startedAt = Date.now();

  return (
    <div className="rating-page">
      <p>
        <Link href={`/eventos/${context.slug}`} className="back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          {context.title}
        </Link>
      </p>
      <h1>Como foi o evento?</h1>
      {context.state === "not_open" && (
        <div className="notice" role="note">
          A avaliação abre quando o evento terminar.
        </div>
      )}
      {context.state === "closed" && (
        <div className="notice" role="note">
          O período de avaliação terminou em {formatDateTime(context.window.closesAt)}.
        </div>
      )}
      {context.state === "open" && alreadyRated && (
        <div className="notice notice--success" role="note">
          Você já avaliou este evento neste aparelho. Obrigado!
        </div>
      )}
      {context.state === "open" && !alreadyRated && (
        <>
          <p className="hint">
            Avaliação aberta até {formatDateTime(context.window.closesAt)}. Leva menos de 30 segundos.
          </p>
          <RatingForm slug={context.slug} startedAt={startedAt} action={submitRatingAction} />
          <p className="callout callout--quiet">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>
              Sem cadastro. Para evitar avaliações repetidas, guardamos só um identificador aleatório deste
              aparelho, pseudonimizado. <Link href="/privacidade">Saiba mais</Link>.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
