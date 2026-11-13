import { getPublicEventBySlug } from "@/application/events/event-queries";
import { buildIcs } from "@/domain/calendar/ics";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { formatVenue } from "@/ui/format";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicEventBySlug(await getDb(), (await params).slug);
  if (!event) return new Response("Evento não encontrado", { status: 404 });
  const { publicBaseUrl } = getConfig();
  const ics = buildIcs(
    {
      id: event.id,
      title: event.title,
      description: event.description,
      location: formatVenue(event.venue, event.locationDetail),
      url: `${publicBaseUrl}/eventos/${event.slug}`,
      startsAt: event.startsAt,
      endsAt: event.endedAt ?? event.endsAt,
      sequence: event.icsSequence,
      cancelled: event.status === "cancelled",
    },
    { domain: new URL(publicBaseUrl).hostname, now: new Date() },
  );
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${event.slug}.ics"`,
      "cache-control": "no-store",
    },
  });
}
