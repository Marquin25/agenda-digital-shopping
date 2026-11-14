import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listSegments, saveStore } from "@/application/catalog/stores";
import { saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { cancelEvent } from "@/application/events/event-commands";
import {
  confirmEventImport,
  discardEventImport,
  getEventImport,
  importErrorReport,
  listImportedEvents,
  previewEventImport,
  stageEventImport,
} from "@/application/events/event-import";
import { listAdminEvents } from "@/application/events/event-queries";
import { applyRetention } from "@/application/metrics/retention";
import { auditLog, eventAccessibilityFeatures, events, eventStores } from "@/infrastructure/db/schema";
import { MemoryFileStorage } from "./memory-file-storage";
import { createTestDb } from "./test-db";

const NOW = new Date("2026-11-14T12:00:00Z");
const HEADER = [
  "Código",
  "Título",
  "Descrição",
  "Início",
  "Término",
  "Espaço",
  "Detalhe do local",
  "Categoria",
  "Acessibilidade",
  "Lojas",
  "Entrada",
  "Vagas",
  "Vagas exibidas",
  "Dias para avaliar",
  "Publicar",
];

type Row = Partial<Record<(typeof HEADER)[number], string>>;
const sheet = (...rows: Row[]) => [
  HEADER,
  ...rows.map((r) => {
    const values: Row = {
      Título: "Oficina de Natal",
      Descrição: "Oficina de enfeites para crianças",
      Início: "20/12/2026 15:00",
      Término: "20/12/2026 17:00",
      Espaço: "praca central",
      Categoria: "Infantil",
      Publicar: "Sim",
      ...r,
    };
    return HEADER.map((h) => values[h] ?? "");
  }),
];

describe("spreadsheet import of events (B-94)", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Editor",
    email: "editor@example.test",
    role: "editor",
    temporaryPassword: "senha-de-teste-longa",
  });
  await saveVenue(db, userId, venueInputSchema.parse({ name: "Praça Central", floor: "L1" }));
  const segmentId = (await listSegments(db))[0]!.id;
  const storeId = await saveStore(db, userId, { name: "Livraria Leitura", segmentId, floor: "" });

  it("previews a valid sheet without writing, resolving names regardless of case and accents", async () => {
    const preview = await previewEventImport(
      db,
      sheet({
        Código: "natal-01",
        Acessibilidade: "interprete de libras; Audiodescrição",
        Lojas: "LIVRARIA LEITURA",
        Vagas: "Ordem de chegada",
        "Vagas exibidas": "30",
      }),
      NOW,
    );
    expect(preview.fileErrors).toEqual([]);
    expect(preview.counts).toEqual({ create: 1, update: 0, skip: 0, reject: 0 });
    expect(preview.rows[0]).toMatchObject({
      line: 2,
      action: "create",
      code: "NATAL-01",
      publish: true,
      errors: [],
    });
    expect(await listAdminEvents(db, {})).toHaveLength(0);
  });

  it("creates and publishes on confirmation, with the code, features and stores", async () => {
    const id = await stageEventImport(
      db,
      userId,
      "eventos.xlsx",
      sheet(
        { Código: "natal-01", Acessibilidade: "Intérprete de Libras", Lojas: "Livraria Leitura" },
        { Título: "Feira de Adoção", Categoria: "Inclusivo/Acessível", Publicar: "" },
      ),
    );
    const preview = await previewEventImport(db, (await getEventImport(db, id))!.rows, NOW);
    const result = await confirmEventImport(db, userId, id, preview.fingerprint, NOW);
    expect(result).toMatchObject({
      status: "confirmed",
      summary: { created: 2, updated: 0, skipped: 0, rejected: 0 },
    });

    const [natal] = await db.select().from(events).where(eq(events.importCode, "NATAL-01"));
    expect(natal).toMatchObject({ title: "Oficina de Natal", publicationStatus: "published" });
    expect(natal!.startsAt).toEqual(new Date("2026-12-20T18:00:00Z")); // 15:00 in São Paulo
    expect(await db.select().from(eventStores).where(eq(eventStores.eventId, natal!.id))).toEqual([
      { eventId: natal!.id, storeId },
    ]);
    expect(
      await db
        .select()
        .from(eventAccessibilityFeatures)
        .where(eq(eventAccessibilityFeatures.eventId, natal!.id)),
    ).toHaveLength(1);
    const [adoption] = await db.select().from(events).where(eq(events.title, "Feira de Adoção"));
    expect(adoption).toMatchObject({ publicationStatus: "draft", importCode: null });

    const audit = await db.select().from(auditLog).where(eq(auditLog.action, "event.import"));
    expect(audit[0]?.details).toEqual({ created: 2, updated: 0, skipped: 0, rejected: 0 });
    expect(await confirmEventImport(db, userId, id, preview.fingerprint, NOW)).toEqual({
      status: "already_confirmed",
    });
  });

  it("updates only by code, skips natural duplicates and never touches events by title alone", async () => {
    const rows = sheet(
      { Código: "NATAL-01", Título: "Oficina de Natal (nova sala)", "Detalhe do local": "Sala 2" },
      { Título: "Feira de Adoção", Categoria: "Inclusivo/Acessível" },
      {
        Título: "Feira de Adoção",
        Categoria: "Inclusivo/Acessível",
        Início: "21/12/2026 15:00",
        Término: "21/12/2026 17:00",
      },
      {
        Título: "Feira de Adoção",
        Categoria: "Inclusivo/Acessível",
        Início: "21/12/2026 15:00",
        Término: "21/12/2026 17:00",
      },
    );
    const preview = await previewEventImport(db, rows, NOW);
    expect(preview.rows.map((r) => [r.line, r.action])).toEqual([
      [2, "update"],
      [3, "skip"],
      [4, "create"],
      [5, "skip"],
    ]);
    expect(preview.rows[1]!.warnings[0]!.message).toContain(
      "Já existe um evento com o mesmo título, início e espaço",
    );
    expect(preview.rows[3]!.warnings[0]!.message).toBe("Repete a linha 4 (mesmo título, início e espaço).");

    const id = await stageEventImport(db, userId, "eventos.csv", rows);
    const result = await confirmEventImport(db, userId, id, preview.fingerprint, NOW);
    expect(result).toMatchObject({ status: "confirmed", summary: { created: 1, updated: 1, skipped: 2 } });
    const [natal] = await db.select().from(events).where(eq(events.importCode, "NATAL-01"));
    expect(natal).toMatchObject({
      title: "Oficina de Natal (nova sala)",
      locationDetail: "Sala 2",
      icsSequence: 2,
    });
  });

  it("rejects rows with missing fields, invalid dates or unknown names, and imports the rest", async () => {
    const rows = sheet(
      { Título: "", Descrição: "curta" },
      { Título: "Data impossível", Início: "31/02/2027 10:00" },
      { Título: "Ao contrário", Início: "20/12/2026 18:00", Término: "20/12/2026 17:00" },
      { Título: "Espaço inexistente", Espaço: "Terraço", Lojas: "Loja Fantasma" },
      { Título: "Código repetido A", Código: "DUP-1" },
      {
        Título: "Código repetido B",
        Código: "dup-1",
        Início: "22/12/2026 10:00",
        Término: "22/12/2026 11:00",
      },
      { Título: "Feira de Adoção", Categoria: "Inclusivo/Acessível" },
    );
    const preview = await previewEventImport(db, [...rows, HEADER.map(() => "")], NOW);
    const byLine = new Map(preview.rows.map((r) => [r.line, r]));
    expect(byLine.get(2)!.errors).toEqual([
      { column: "Título", message: "Informe um título com pelo menos 3 caracteres." },
      { column: "Descrição", message: "Descreva o evento (mínimo de 10 caracteres)." },
    ]);
    expect(byLine.get(3)!.errors).toEqual([
      { column: "Início", message: "Data e hora inválidas. Use dd/mm/aaaa hh:mm." },
    ]);
    expect(byLine.get(4)!.errors).toEqual([
      { column: "Término", message: "O término precisa ser depois do início." },
    ]);
    expect(byLine.get(5)!.errors).toEqual([
      { column: "Espaço", message: "Espaço “Terraço” não está cadastrado ou está inativo." },
      { column: "Lojas", message: "Loja “Loja Fantasma” não está cadastrada ou está inativa." },
    ]);
    expect(byLine.get(6)!.action).toBe("create");
    expect(byLine.get(7)!.errors).toEqual([
      { column: "Código", message: "Código repetido na planilha (linha 6)." },
    ]);
    // Line 8 repeats the defaults of an event that already exists (skip); the empty line 9 is not counted.
    expect(byLine.has(9)).toBe(false);
    expect(preview.counts).toEqual({ create: 1, update: 0, skip: 1, reject: 5 });

    const report = importErrorReport(preview);
    expect(report).toContain("Linha;Situação;Coluna;Mensagem");
    expect(report).toContain("3;Rejeitada;Início;Data e hora inválidas. Use dd/mm/aaaa hh:mm.");
  });

  it("refuses to update cancelled events or with an incomplete header", async () => {
    const [natal] = await db.select().from(events).where(eq(events.importCode, "NATAL-01"));
    const partial = [
      ["Código", "Título", "Descrição", "Início", "Término", "Espaço", "Categoria"],
      [
        "NATAL-01",
        "Oficina de Natal",
        "Oficina de enfeites para crianças",
        "20/12/2026 15:00",
        "20/12/2026 17:00",
        "Praça Central",
        "Infantil",
      ],
    ];
    expect((await previewEventImport(db, partial, NOW)).rows[0]!.errors[0]!.message).toBe(
      "Para atualizar um evento pelo código, a planilha precisa ter todas as colunas do modelo.",
    );
    await cancelEvent(db, userId, natal!.id);
    expect(
      (await previewEventImport(db, sheet({ Código: "NATAL-01" }), NOW)).rows[0]!.errors[0]!.message,
    ).toBe("Evento cancelado não pode ser alterado pela planilha.");
  });

  it("re-checks on confirmation and asks to review again when the data changed", async () => {
    const rows = sheet({
      Código: "NOVO-1",
      Título: "Show de mágica",
      Início: "23/12/2026 10:00",
      Término: "23/12/2026 11:00",
    });
    const id = await stageEventImport(db, userId, "eventos.xlsx", rows);
    const preview = await previewEventImport(db, rows, NOW);
    const other = await stageEventImport(db, userId, "outra.xlsx", rows);
    const otherPreview = await previewEventImport(db, rows, NOW);
    await confirmEventImport(db, userId, other, otherPreview.fingerprint, NOW);
    expect(await confirmEventImport(db, userId, id, preview.fingerprint, NOW)).toEqual({ status: "changed" });
  });

  it("rejects files over the row limit and sheets without the required columns", async () => {
    const tooMany = [HEADER, ...Array.from({ length: 501 }, () => HEADER.map(() => "x"))];
    expect((await previewEventImport(db, tooMany, NOW)).fileErrors).toEqual([
      "A planilha tem 501 linhas de eventos; o máximo é 500.",
    ]);
    expect((await previewEventImport(db, [["Nome", "Data"]], NOW)).fileErrors).toContain(
      "Falta a coluna obrigatória “Título”.",
    );
    expect((await previewEventImport(db, [], NOW)).fileErrors).toEqual(["A planilha está vazia."]);
  });

  it("discards only unconfirmed imports and lists the events a confirmation wrote", async () => {
    const rows = sheet({
      Código: "DESC-1",
      Título: "Contação de histórias",
      Início: "24/12/2026 10:00",
      Término: "24/12/2026 11:00",
    });
    const pending = await stageEventImport(db, userId, "a.xlsx", rows);
    expect(await discardEventImport(db, pending)).toBe(true);
    expect(await getEventImport(db, pending)).toBeNull();

    const confirmed = await stageEventImport(db, userId, "b.xlsx", rows);
    const result = await confirmEventImport(
      db,
      userId,
      confirmed,
      (await previewEventImport(db, rows, NOW)).fingerprint,
      NOW,
    );
    expect(await discardEventImport(db, confirmed)).toBe(false);
    const ids = result.status === "confirmed" ? result.summary.eventIds : [];
    expect(await listImportedEvents(db, ids)).toEqual([
      expect.objectContaining({ title: "Contação de histórias", status: "published" }),
    ]);
  });

  it("deletes staged imports after 7 days", async () => {
    const id = await stageEventImport(db, userId, "velha.xlsx", sheet({}));
    const result = await applyRetention(
      db,
      new MemoryFileStorage(),
      new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    );
    expect(result.eventImports).toBeGreaterThanOrEqual(1);
    expect(await getEventImport(db, id)).toBeNull();
  });
});
