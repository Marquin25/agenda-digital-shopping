import {
  listAccessibilityFeatures,
  listCategories,
  saveVenue,
  venueInputSchema,
} from "@/application/catalog/catalog";
import { listSegments, saveStore, storeInputSchema } from "@/application/catalog/stores";
import { cancelEvent, createEvent, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { addDaysToDateKey, toLocalDateKey, toLocalDateTimeInput } from "@/domain/time/time-zone";
import type { Database } from "@/infrastructure/db/client";
import { events } from "@/infrastructure/db/schema";

type Outcome = "published" | "cancelled" | "draft";

interface DemoEvent {
  title: string;
  category: string;
  venue: "central" | "food";
  start: string;
  end: string;
  features: string[];
  admission: string;
  capacity?: string;
  stores?: string[];
  outcome: Outcome;
}

const HOUR = 3_600_000;

const DEMO_STORES: [name: string, segmentSlug: string, floor: string][] = [
  ["Café Grão Dourado", "alimentacao", "L2"],
  ["Doceria Flor de Açúcar", "alimentacao", "L2"],
  ["Brinquedos Pião", "lazer", "L1"],
  ["Ateliê Linho & Algodão", "moda", "L1"],
  ["Pixel Eletrônicos", "tecnologia", "L3"],
];

/** Fictional events relative to `now`, one or more for every event status. */
function demoEvents(now: Date): DemoEvent[] {
  const today = toLocalDateKey(now);
  const day = (offset: number, time: string) => `${addDaysToDateKey(today, offset)}T${time}`;
  const thisHour = new Date(Math.floor(now.getTime() / HOUR) * HOUR);
  const hoursFromNow = (h: number) => toLocalDateTimeInput(new Date(thisHour.getTime() + h * HOUR));
  return [
    {
      title: "Oficina de Pintura Kids",
      category: "infantil",
      venue: "central",
      start: hoursFromNow(-1),
      end: hoursFromNow(3),
      features: ["cadeira-de-rodas", "espaco-sensorial"],
      admission: "Gratuito",
      capacity: "30",
      stores: ["Brinquedos Pião"],
      outcome: "published", // ongoing
    },
    {
      title: "Show Acústico na Praça",
      category: "musica",
      venue: "central",
      start: day(3, "19:00"),
      end: day(3, "21:00"),
      features: ["libras"],
      admission: "Gratuito",
      outcome: "published", // scheduled
    },
    {
      title: "Festival de Sabores",
      category: "gastronomia",
      venue: "food",
      start: day(5, "12:00"),
      end: day(5, "18:00"),
      features: ["pet-friendly"],
      admission: "Degustações pagas nas lojas participantes",
      stores: ["Café Grão Dourado", "Doceria Flor de Açúcar"],
      outcome: "published",
    },
    {
      title: "Sessão Sensorial de Cinema",
      category: "inclusivo",
      venue: "central",
      start: day(8, "10:00"),
      end: day(8, "12:00"),
      features: ["espaco-sensorial", "audiodescricao", "libras"],
      admission: "Gratuito",
      capacity: "50",
      outcome: "published",
    },
    {
      title: "Aula de Culinária em Família",
      category: "gastronomia",
      venue: "food",
      start: day(-6, "10:00"),
      end: day(-6, "13:00"),
      features: ["cadeira-de-rodas"],
      admission: "Gratuito",
      outcome: "published", // ended
    },
    {
      title: "Noite de Jazz na Praça",
      category: "musica",
      venue: "central",
      start: day(12, "20:00"),
      end: day(12, "22:00"),
      features: [],
      admission: "Gratuito",
      outcome: "cancelled",
    },
    {
      title: "Festival de Inverno",
      category: "infantil",
      venue: "central",
      start: day(20, "14:00"),
      end: day(20, "18:00"),
      features: ["libras"],
      admission: "Gratuito",
      outcome: "draft",
    },
  ];
}

/**
 * Demo content for local development and screenshots only (never production). Runs once: when any
 * event exists it does nothing, so it never duplicates or overwrites real data.
 */
export async function seedDemoData(
  db: Database,
  now = new Date(),
): Promise<{ created: number } | { skipped: true }> {
  if ((await db.select({ id: events.id }).from(events).limit(1)).length > 0) return { skipped: true };

  const categories = await listCategories(db);
  const features = await listAccessibilityFeatures(db);
  const categoryId = (slug: string) => categories.find((c) => c.slug === slug)!.id;
  const featureIds = (slugs: string[]) => features.filter((f) => slugs.includes(f.slug)).map((f) => f.id);
  const venues = {
    central: await saveVenue(
      db,
      null,
      venueInputSchema.parse({
        name: "Praça Central",
        floor: "L1",
        reference: "Próximo à fonte",
        capacity: "200",
        facilities: "energia, som, palco",
      }),
    ),
    food: await saveVenue(
      db,
      null,
      venueInputSchema.parse({ name: "Praça de Alimentação", floor: "L2", capacity: "300" }),
    ),
  };

  // Fictional business names only; no real brands and no contacts of people.
  const segmentId = async (slug: string) => (await listSegments(db)).find((s) => s.slug === slug)!.id;
  const storeIds = new Map<string, string>();
  for (const [name, segment, floor] of DEMO_STORES) {
    const id = await saveStore(
      db,
      null,
      storeInputSchema.parse({ name, segmentId: await segmentId(segment), floor }),
    );
    storeIds.set(name, id);
  }

  const demo = demoEvents(now);
  for (const d of demo) {
    const id = await createEvent(
      db,
      null,
      eventInputSchema.parse({
        title: d.title,
        description: `Evento de demonstração: ${d.title}. Conteúdo fictício para testes locais.`,
        startsAt: d.start,
        endsAt: d.end,
        venueId: venues[d.venue],
        categoryId: categoryId(d.category),
        featureIds: featureIds(d.features),
        storeIds: (d.stores ?? []).map((name) => storeIds.get(name)!),
        admissionInfo: d.admission,
        capacityMode: d.capacity ? "first_come" : "unlimited",
        displayedCapacity: d.capacity ?? "",
      }),
      null,
    );
    if (d.outcome === "draft") continue;
    await publishEvent(db, null, id, now);
    if (d.outcome === "cancelled") await cancelEvent(db, null, id);
  }
  return { created: demo.length };
}
