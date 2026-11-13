import "./env";
import path from "node:path";
import {
  listAccessibilityFeatures,
  listCategories,
  saveVenue,
  venueInputSchema,
} from "@/application/catalog/catalog";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { createEvent, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { addDaysToDateKey, toLocalDateKey } from "@/domain/time/time-zone";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";
import { events } from "@/infrastructure/db/schema";

/** Demo content for local development only. Never run against production. */
const connection = await connect(getConfig().databaseUrl);
const db = connection.db;
await connection.migrate(path.join(process.cwd(), "drizzle"));
await seedReferenceData(db);

if ((await db.select({ id: events.id }).from(events).limit(1)).length > 0) {
  console.log("Events already exist; demo seed skipped.");
} else {
  const categories = await listCategories(db);
  const features = await listAccessibilityFeatures(db);
  const cat = (slug: string) => categories.find((c) => c.slug === slug)!.id;
  const feat = (...slugs: string[]) => features.filter((f) => slugs.includes(f.slug)).map((f) => f.id);
  const venueId = await saveVenue(
    db,
    null,
    venueInputSchema.parse({
      name: "Praça Central",
      floor: "L1",
      reference: "Próximo à fonte",
      capacity: "200",
      facilities: "energia, som, palco",
    }),
  );
  const food = await saveVenue(
    db,
    null,
    venueInputSchema.parse({ name: "Praça de Alimentação", floor: "L2", capacity: "300" }),
  );
  const today = toLocalDateKey(new Date());
  const day = (offset: number, time: string) => `${addDaysToDateKey(today, offset)}T${time}`;
  const demo = [
    {
      title: "Oficina de Pintura Kids",
      category: "infantil",
      venue: venueId,
      start: day(0, "15:00"),
      end: day(0, "23:30"),
      features: ["cadeira-de-rodas", "espaco-sensorial"],
      admission: "Gratuito",
      mode: "first_come",
      capacity: "30",
    },
    {
      title: "Show Acústico de Sábado",
      category: "musica",
      venue: venueId,
      start: day(3, "19:00"),
      end: day(3, "21:00"),
      features: ["libras"],
      admission: "Gratuito",
      mode: "unlimited",
      capacity: "",
    },
    {
      title: "Festival de Sabores",
      category: "gastronomia",
      venue: food,
      start: day(5, "12:00"),
      end: day(5, "18:00"),
      features: ["pet-friendly"],
      admission: "Degustações pagas nas lojas participantes",
      mode: "unlimited",
      capacity: "",
    },
    {
      title: "Sessão Sensorial de Cinema",
      category: "inclusivo",
      venue: venueId,
      start: day(8, "10:00"),
      end: day(8, "12:00"),
      features: ["espaco-sensorial", "audiodescricao", "libras"],
      admission: "Gratuito",
      mode: "first_come",
      capacity: "50",
    },
  ];
  for (const d of demo) {
    const input = eventInputSchema.parse({
      title: d.title,
      description: `Evento de demonstração: ${d.title}. Conteúdo fictício para testes locais.`,
      startsAt: d.start,
      endsAt: d.end,
      venueId: d.venue,
      categoryId: cat(d.category),
      featureIds: feat(...d.features),
      admissionInfo: d.admission,
      capacityMode: d.mode,
      displayedCapacity: d.capacity,
    });
    const id = await createEvent(db, null, input, null);
    await publishEvent(db, null, id);
  }
  console.log(`Demo seed created ${demo.length} published events.`);
}
await connection.close();
